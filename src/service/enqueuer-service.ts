import {classToClass} from "class-transformer";
import { ReportGenerator } from "../report/report-generator";
import { MessengerService, MessengerServiceCallback } from "../service/messenger-service";
import { SubscriptionOnMessageReceivedExecutor } from "../function-executor/subscription-on-message-received-executor";
import { Requisition } from "./requisition/requisition";
import { Subscription } from "./requisition/subscription/subscription";

export class EnqueuerService implements MessengerService {
    private requisition: Requisition;
    private onFinishCallback: MessengerServiceCallback | null = null;
    private startTime: number = 0;
    private timer: NodeJS.Timer | null = null;
    private reportGenerator: ReportGenerator = new ReportGenerator();

    constructor(requisition: Requisition) {
        this.requisition = classToClass(requisition); //clone
    }

    public start(onFinishCallback: MessengerServiceCallback): void {
        this.startTime = Date.now();
        this.reportGenerator.addInfo({startTime: new Date().toString()})
        this.onFinishCallback = onFinishCallback;
        this.subscribeSubscriptions();
        // this.onStartEventReceived(null); //remove this
    }

    private onSubscriptionCompleted(subscription: Subscription) {
        console.log("I have to count how many subscriptions are completed");
        this.requisition.startEvent.execute((message: any) => this.onStartEventReceived(message));
    }

    private onStartEventReceived(startEvent: any) {
        console.log("Start event was fired");

        this.setTimeout(this.requisition.startEvent.timeout);
    }

    // private publish(): void {
    //     console.log("onPublish");
    //     if (this.requisition.startEvent && this.requisition.startEvent.publish)
    //         this.requisition.startEvent.publish.execute();
    //
    //     if (this.requisition.startEvent && this.requisition.startEvent.publish  && this.requisition.startEvent.publish.mqtt) {
    //         this.client.publish(this.requisition.startEvent.publish.mqtt.topic,
    //                             this.requisition.startEvent.publish.mqtt.payload);
    //
    //         const elapsedTime = Date.now() - this.startTime;
    //         let warning = {};
    //         try {
    //             new PublishPrePublishingExecutor(this.requisition.startEvent.publish, {payload: this.requisition.startEvent.publish.mqtt.payload,
    //                 topic: this.requisition.startEvent.publish.mqtt.topic});
    //         }
    //         catch (exception) {
    //             warning = exception;
    //         }
    //
    //         this.reportGenerator.addPublishReport({
    //                                                 publish: this.requisition.startEvent.publish,
    //                                                 elapsedTime: elapsedTime,
    //                                                 warning: warning
    //                                             });
    //     }
    // }

    private setTimeout(totalTimeout: number): void {
        console.log("timeout: " + totalTimeout)
        if (totalTimeout != -1) {
            this.reportGenerator.addInfo({totalTimeout: totalTimeout});
            this.timer = global.setTimeout(() => this.onFinish(), totalTimeout);
        }
    }

    // private onMessageReceived(topic: string, payloadBuffer: string): void {
    //     const payload: string = payloadBuffer.toString();
    //
    //     var index = this.requisition.subscriptions.findIndex((subscription: Subscription) => {
    //         return subscription.mqtt != null && subscription.mqtt.topic == topic;
    //     });
    //
    //     if (index > -1) {
    //         let subscription: Subscription = this.requisition.subscriptions[index];
    //         this.requisition.subscriptions.splice(index, 1);
    //         this.generateSubscriptionReceivedMessageReport(subscription, {payload: payload, topic: topic});
    //
    //         if (this.requisition.subscriptions.length === 0) {
    //             this.onFinish();
    //         }
    //     }
    // }

    // private generateSubscriptionReceivedMessageReport(subscription: Subscription, message: any) {
    //     const elapsedTime = Date.now() - this.startTime;
    //
    //     let onMessageReceived = {};
    //     if (message) {
    //         try {
    //             let subscriptionTestExecutor: SubscriptionOnMessageReceivedExecutor
    //                             = new SubscriptionOnMessageReceivedExecutor(subscription, this.requisition.startEvent && this.requisition.startEvent.publish, message);
    //
    //             subscriptionTestExecutor.execute();
    //
    //             onMessageReceived = {
    //                 tests: {
    //                     failing: subscriptionTestExecutor.getFailingTests(),
    //                     passing: subscriptionTestExecutor.getPassingTests(),
    //                     onMessageReceivedExecutionException: subscriptionTestExecutor.getWarning()
    //                 },
    //                 reports: subscriptionTestExecutor.getReports()
    //             }
    //         } catch (exc) {
    //             onMessageReceived = {
    //                 onMessageReceivedFunctionCreationException: exc
    //             }
    //         }
    //     }
    //
    //     var subscriptionReport = {
    //         ...subscription,
    //         elapsedTime: elapsedTime,
    //         timestamp: new Date(),
    //         message: message,
    //         onMessageReceived: onMessageReceived
    //     };
    //     this.reportGenerator.addSubscriptionReport(subscriptionReport);
    // }
    //
    // private generateSubscriptionDidNotReceivedMessageReport(subscription: Subscription) {
    //     const elapsedTime = Date.now() - this.startTime;
    //
    //     var subscriptionReport = {
    //         ...subscription,
    //         elapsedTime: elapsedTime,
    //         hasTimedOut: true
    //     };
    //     this.reportGenerator.addSubscriptionReport(subscriptionReport);
    // }

    private onSubscriptionMessage(subscription: Subscription) {
        console.log("Subscription valid: " + subscription);

            // this.generateSubscriptionReceivedMessageReport(subscription);

            // if (this.requisition.subscriptions.length === 0) {
            //     this.onFinish();
            // }

    }

    private subscribeSubscriptions(): void {
        this.requisition.subscriptions
                .forEach(subscription =>
                    subscription.subscribe((subscription: Subscription) => this.onSubscriptionMessage(subscription),
                        (subscription: Subscription) => this.onSubscriptionCompleted(subscription)));
                // .forEach((subscription: Subscription) => {
                //     subscription.subscribe((subscription: Subscription) => this.onSubscriptionMessage(subscription));
                //     if (subscription.mqtt)
                //         this.client.subscribe(subscription.mqtt.topic)
                // });
    }

    private onFinish(): void {
        if (this.timer)
            global.clearTimeout(this.timer);

        // this.client.end(true);
        const totalTime = Date.now() - this.startTime;

        this.requisition.subscriptions.forEach(subscription =>
            subscription.unsubscribe());
                // .forEach((subscription: Subscription) => {
                //     subscription.unsubscribe();
                //     this.generateSubscriptionDidNotReceivedMessageReport(subscription);
                // });

        this.reportGenerator.addInfo({endTime: new Date().toString(), totalTime: totalTime})
        
        if (this.onFinishCallback)
            this.onFinishCallback(this.reportGenerator.generate());
    }
}