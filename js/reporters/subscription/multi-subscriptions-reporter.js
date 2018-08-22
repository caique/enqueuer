"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const subscription_reporter_1 = require("./subscription-reporter");
class MultiSubscriptionsReporter {
    constructor(subscriptionsAttributes) {
        this.subscriptionReporters = [];
        this.subscriptionsStoppedWaitingCounter = 0;
        if (subscriptionsAttributes) {
            this.subscriptionReporters = subscriptionsAttributes.map((subscription, index) => {
                if (!subscription.name) {
                    subscription.name = `Subscription #${index}`;
                }
                return new subscription_reporter_1.SubscriptionReporter(subscription);
            });
        }
    }
    subscribe() {
        return Promise.all(this.subscriptionReporters.map(subscriptionHandler => {
            subscriptionHandler.startTimeout(() => {
                if (this.haveAllSubscriptionsStoppedWaiting()) {
                    return Promise.resolve();
                }
            });
            return subscriptionHandler.subscribe();
        }));
    }
    receiveMessage() {
        return new Promise((resolve, reject) => {
            if (this.subscriptionReporters.length <= 0) {
                return resolve();
            }
            this.subscriptionReporters.forEach(subscriptionHandler => {
                subscriptionHandler.receiveMessage()
                    .then(() => {
                    if (this.haveAllSubscriptionsStoppedWaiting()) {
                        resolve();
                    }
                })
                    .catch(err => reject(err));
            });
        });
    }
    getReport() {
        return this.subscriptionReporters.map(subscription => subscription.getReport());
    }
    haveAllSubscriptionsStoppedWaiting() {
        ++this.subscriptionsStoppedWaitingCounter;
        return (this.subscriptionsStoppedWaitingCounter >= this.subscriptionReporters.length);
    }
}
exports.MultiSubscriptionsReporter = MultiSubscriptionsReporter;
