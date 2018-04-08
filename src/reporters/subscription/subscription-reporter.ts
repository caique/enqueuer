import {MetaFunctionExecutor} from "../../meta-functions/meta-function-executor";
import {OnMessageReceivedMetaFunction} from "../../meta-functions/on-message-received-meta-function";
import {Logger} from "../../loggers/logger";
import {DateController} from "../../timers/date-controller";
import {SubscriptionModel} from "../../requisitions/models/subscription-model";
import Signals = NodeJS.Signals;
import {Container} from "../../injector/container";
import {Subscription} from "../../subscriptions/subscription";
import {Report} from "../report";
import {Timeout} from "../../timers/timeout";
import {Reporter} from "../reporter";

export class SubscriptionReporter implements Reporter {

    private subscription: SubscriptionModel;
    private report: Report;
    private subscriptionAttributes: SubscriptionModel;
    private startTime: DateController;
    private timeOut?: Timeout;
    private hasTimedOut: boolean = false;

    constructor(subscriptionAttributes: SubscriptionModel) {
        this.subscription = Container.get(Subscription).createFromPredicate(subscriptionAttributes);
        this.subscriptionAttributes = subscriptionAttributes;
        this.startTime = new DateController();
        this.report = {
            valid: false,
            errorsDescription: []
        };
    }

    public onTimeout(onTimeOutCallback: Function) {
        this.timeOut = new Timeout(() => {
            const message = `Subscription '${this.subscription.type}' stop waiting because it has timed out`;
            Logger.info(message);
            this.cleanUp();
            this.hasTimedOut = true;
            this.report.errorsDescription.push(message);
            onTimeOutCallback();
        });
    }

    public connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.subscription.connect()
                .then(() => {
                    this.report = {
                        ...this.report,
                        connectionTime: new DateController().toString()
                    };
                    resolve();

                    process.on('SIGINT', this.handleKillSignal);
                    process.on('SIGTERM', this.handleKillSignal);

                })
                .catch((err: any) => {
                    const message = `Subscription '${this.subscription.type}' is unable to connect: ${err}`;
                    this.report.errorsDescription.push(message)
                    reject(err);
                });
        });
    }

    public receiveMessage(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.initializeTimeout();

            this.subscription.receiveMessage()
                .then((message: any) => {
                    Logger.debug(`Subscription ${this.subscription.type} received its message: ${JSON.stringify(message)}`);

                    if (!this.hasTimedOut) {
                        this.subscription.messageReceived = message;
                        this.executeSubscriptionFunction();
                        Logger.info("Subscription stop waiting because it has already received its message");
                    }
                    this.cleanUp();
                    resolve();
                })
                .catch((err: any) => {
                    const message = `Subscription '${this.subscription.type}' is unable to receive message: ${err}`;
                    this.report.errorsDescription.push(message)
                    this.subscription.unsubscribe();
                    reject(err);
                });
        });
    }

    public getReport(): Report {
        this.cleanUp();
        this.report = {
            ...this.report,
            ...this.subscriptionAttributes,
            hasReceivedMessage: this.subscription.messageReceived != null,
            hasTimedOut: this.hasTimedOut
        };
        const hasReceivedMessage = this.report.hasReceivedMessage;
        if (!hasReceivedMessage)
            this.report.errorsDescription.push(`Subscription '${this.subscription.type}' didn't receive any message`);

        this.report.valid = hasReceivedMessage &&
                            !this.hasTimedOut &&
                            this.report.functionReport.failingTests.length <= 0;

        return this.report;
    }

    private cleanUp(): void {
        this.cleanUp = () => {};
        Logger.info(`Unsubscribing subscription ${this.subscription.type}`);
        try {
            this.subscription.unsubscribe();
        } catch (err) {
            Logger.error(err);
        }
        if (this.timeOut)
            this.timeOut.clear();
    }

    private initializeTimeout() {
        if (this.timeOut && this.subscription.timeout) {
            Logger.debug(`Setting ${this.subscription.type} subscription timeout to ${this.subscription.timeout}ms`);
            this.timeOut.start(this.subscription.timeout);
        }
    }

    private executeSubscriptionFunction() {
        const onMessageReceivedSubscription = new OnMessageReceivedMetaFunction(this.subscription);
        const functionResponse = new MetaFunctionExecutor(onMessageReceivedSubscription).execute();
        Logger.debug(`Response of subscription onMessageReceived function: ${JSON.stringify(functionResponse)}`);
        this.report.errorsDescription = this.report.errorsDescription.concat(functionResponse.report.failingTests);

        this.report = {
            ...this.report,
            functionReport: functionResponse.report,
            messageReceivedTimestamp: new DateController().toString()
        }
    }

    private handleKillSignal = (signal: Signals): void => {
        Logger.fatal(`Handling kill signal ${signal}`);
        this.cleanUp();
        new Timeout(() => {
            Logger.fatal("Adios muchachos");
            process.exit(1);
        }).start(2000);
    }

}
