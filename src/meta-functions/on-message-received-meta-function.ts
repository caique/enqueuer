import {MetaFunctionCreator} from "./meta-function-creator";
import {SubscriptionModel} from "../models/subscription-model";

export class OnMessageReceivedMetaFunction implements MetaFunctionCreator {

    private subscriptionAttributes: SubscriptionModel;

    public constructor(subscriptionAttributes: SubscriptionModel) {
        this.subscriptionAttributes = subscriptionAttributes;
    }

    public createBody(): string {
        return    `let test = {};
                    let report = {};
                    let message = ${JSON.stringify(this.subscriptionAttributes.messageReceived)};
                    ${this.subscriptionAttributes.onMessageReceived};
                    return {
                            test: test,
                            report: report
                     };`;
    }

}