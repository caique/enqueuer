import {Logger} from '../../loggers/logger';
import {DateController} from '../../timers/date-controller';
import {Subscription} from '../../subscriptions/subscription';
import {Timeout} from '../../timers/timeout';
import * as input from '../../models/inputs/subscription-model';
import {SubscriptionModel} from '../../models/inputs/subscription-model';
import * as output from '../../models/outputs/subscription-model';
import {OnInitEventExecutor} from '../../events/on-init-event-executor';
import {OnMessageReceivedEventExecutor} from '../../events/on-message-received-event-executor';
import {SubscriptionFinalReporter} from './subscription-final-reporter';
import {OnFinishEventExecutor} from '../../events/on-finish-event-executor';
import {DynamicModulesManager} from '../../plugins/dynamic-modules-manager';
import Signals = NodeJS.Signals;
import SignalsListener = NodeJS.SignalsListener;
import {reportModelIsPassing} from '../../models/outputs/report-model';

export class SubscriptionReporter {

    private static readonly DEFAULT_TIMEOUT: number = 3 * 1000;
    private readonly killListener: SignalsListener;
    private readonly report: output.SubscriptionModel;
    private readonly startTime: DateController;
    private readonly subscription: Subscription;
    private subscribeError?: string;
    private hasTimedOut: boolean = false;
    private subscribed: boolean = false;
    private totalTime?: DateController;

    constructor(subscriptionAttributes: input.SubscriptionModel) {
        this.startTime = new DateController();
        this.report = {
            id: subscriptionAttributes.id,
            name: subscriptionAttributes.name,
            ignored: subscriptionAttributes.ignore,
            type: subscriptionAttributes.type,
            tests: [],
            valid: true
        };

        this.executeOnInitFunction(subscriptionAttributes);

        Logger.debug(`Instantiating subscription ${subscriptionAttributes.type}`);
        this.subscription = DynamicModulesManager.getInstance().getProtocolManager().createSubscription(subscriptionAttributes);
        if (subscriptionAttributes.timeout === undefined) {
            this.subscription.timeout = SubscriptionReporter.DEFAULT_TIMEOUT;
        } else if (subscriptionAttributes.timeout <= 0) {
            delete this.subscription.timeout;
        }
        this.killListener = (signal: Signals) => this.handleKillSignal(signal, this.subscription.type || 'undefined');
    }

    public hasFinished(): boolean {
        return this.subscription.ignore ||
            this.subscription.messageReceived ||
            this.hasTimedOut;
    }

    public startTimeout(onTimeOutCallback: Function) {
        if (this.subscription.timeout) {
            Logger.info(`Starting subscription '${this.subscription.name}' timeout`);
            new Timeout(() => {
                if (!this.subscription.messageReceived) {
                    this.totalTime = new DateController();
                    const message = `Subscription '${this.subscription.name}' stopped waiting because it has timed out`;
                    Logger.info(message);
                    this.hasTimedOut = true;
                    onTimeOutCallback();
                }
            }).start(this.subscription.timeout);
        }
    }

    public async subscribe(): Promise<void> {
        if (this.subscription.ignore) {
            Logger.trace(`Subscription '${this.subscription.name}' is ignored`);
        } else {
            try {
                Logger.trace(`Starting '${this.subscription.name}' time out`);
                Logger.trace(`Subscription '${this.subscription.name}' is subscribing`);
                await this.subscription.subscribe();
                await this.handleSubscription();
            } catch (err) {
                Logger.error(`Subscription '${this.subscription.name}' is unable to subscribe: ${err}`);
                this.subscribeError = JSON.stringify(err);
                throw err;
            }
        }
    }

    public async receiveMessage(): Promise<any> {
        if (!this.subscription.ignore) {
            try {
                const message = await this.subscription.receiveMessage();
                Logger.debug(`${this.subscription.name} received its message`);
                if (message !== null || message !== undefined) {
                    this.handleMessageArrival(message);
                    await this.sendSyncResponse();
                    Logger.trace(`Subscription '${this.subscription.name}' has finished its job`);
                    return;
                } else {
                    Logger.warning(`Type of '${this.subscription.name}' is ${typeof message}`);
                }
            } catch (err) {
                this.subscription.unsubscribe().catch(console.log.bind(console));
                Logger.error(`Subscription '${this.subscription.name}' is unable to receive message: ${err}`);
                throw err;
            }
        }
    }

    private async handleSubscription(): Promise<boolean> {
        process.once('SIGINT', this.killListener)
            .once('SIGTERM', this.killListener);
        if (this.hasTimedOut) {
            const message = `Subscription '${this.subscription.name}' subscription because it has timed out`;
            Logger.error(message);
            return false;
        } else {
            this.report.connectionTime = new DateController().toString();
            this.subscribed = true;
            return true;
        }
    }

    private async sendSyncResponse(): Promise<any> {
        if (this.subscription.response) {
            try {
                Logger.debug(`Subscription ${this.subscription.type} sending synchronous response`);
                await this.subscription.sendResponse();
                return;
            } catch (err) {
                Logger.warning(`Error ${this.subscription.type} synchronous response sending: ${err}`);
                throw err;
            }
        }
    }

    public getReport(): output.SubscriptionModel {
        const time: any = {
            timeout: this.subscription.timeout
        };
        if (!this.totalTime) {
            this.totalTime = new DateController();
        }
        time.totalTime = this.totalTime.getTime() - this.startTime.getTime();
        const finalReporter = new SubscriptionFinalReporter({
            subscribed: this.subscribed,
            avoidable: this.subscription.avoid,
            hasMessage: !!this.subscription.messageReceived,
            time: time,
            subscribeError: this.subscribeError,
            ignore: this.subscription.ignore
        });
        this.report.tests = this.report.tests.concat(finalReporter.getReport());

        this.report.messageReceived = this.subscription.messageReceived;
        this.report.valid = this.report.valid && reportModelIsPassing(this.report);
        return this.report;
    }

    public async unsubscribe(): Promise<void> {
        process.removeListener('SIGINT', this.killListener)
            .removeListener('SIGTERM', this.killListener);

        Logger.debug(`Unsubscribing subscription ${this.subscription.type}`);
        if (this.subscribed) {
            return this.subscription.unsubscribe();
        }
    }

    public onFinish() {
        Logger.trace(`Executing subscription onFinish`);
        if (!this.subscription.ignore) {
            const onFinishEventExecutor = new OnFinishEventExecutor('subscription', this.subscription);
            onFinishEventExecutor.addArgument('elapsedTime', new Date().getTime() - this.startTime.getTime());
            this.report.tests = this.report.tests.concat(onFinishEventExecutor.trigger());
        }
    }

    private handleMessageArrival(message: any) {
        Logger.debug(`${this.subscription.name} message: ${JSON.stringify(message, null, 2)}`.substr(0, 150) + '...');
        if (!this.hasTimedOut) {
            Logger.debug(`${this.subscription.name} stop waiting because it has received its message`);
            this.totalTime = new DateController();
            this.subscription.messageReceived = message;
            this.executeOnMessageReceivedFunction();
        } else {
            Logger.info(`${this.subscription.name} has received message in a unable time`);
        }
        Logger.debug(`${this.subscription.name} handled message arrival`);
    }

    private executeOnInitFunction(subscriptionAttributes: SubscriptionModel) {
        if (!subscriptionAttributes.ignore) {
            Logger.debug(`Executing subscription::onInit hook function`);
            this.report.tests = this.report.tests.concat(new OnInitEventExecutor('subscription', subscriptionAttributes).trigger());
        }
    }

    private executeOnMessageReceivedFunction() {
        Logger.trace(`Executing subscription onMessageReceivedResponse`);
        Logger.trace(`${this.subscription.name} executing hook ${this.subscription.type} specific`);
        this.report.tests = this.subscription.onMessageReceivedTests().concat(this.report.tests);
        const onMessageReceivedEventExecutor = new OnMessageReceivedEventExecutor('subscription', this.subscription);
        onMessageReceivedEventExecutor.addArgument('elapsedTime', new Date().getTime() - this.startTime.getTime());
        this.report.tests = this.report.tests.concat(onMessageReceivedEventExecutor.trigger());
    }

    private async handleKillSignal(signal: Signals, type: string): Promise<void> {
        Logger.fatal(`Subscription reporter '${type}' handling kill signal ${signal}`);
        await this.unsubscribe();
        Logger.fatal(`Subscription reporter '${type}' unsubscribed`);
    }

}
