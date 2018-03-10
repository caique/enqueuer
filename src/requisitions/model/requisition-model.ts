import {SubscriptionModel} from "./Subscription-model";
import {StartEventModel} from "./start-event-model";
import {PublisherModel} from "./publisher-model";

export type RequisitionModel = {
    timeout?: number;
    requisitionVersion: string;
    subscriptions: SubscriptionModel[],
    startEvent: StartEventModel,
    reports: PublisherModel[];
}