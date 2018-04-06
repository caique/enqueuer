import {Publisher} from "../../publishers/publisher";
import {StartEventReporter} from "./start-event-reporter";
import {PrePublishMetaFunction} from "../../meta-functions/pre-publish-meta-function";
import {MetaFunctionExecutor} from "../../meta-functions/meta-function-executor";
import {DateController} from "../../timers/date-controller";
import {PublisherModel} from "../../requisitions/models/publisher-model";
import {Injectable} from "../../injector/injector";
import {Container} from "../../injector/container";
import {Report} from "../report";

@Injectable((startEvent: any) => startEvent.publisher)
export class StartEventPublisherReporter extends StartEventReporter {
    private publisherOriginalAttributes: PublisherModel;
    private publisher?: Publisher;
    private report: Report;
    private prePublishingReport: any = {};

    constructor(startEvent: PublisherModel) {
        super();
        this.publisherOriginalAttributes = startEvent.publisher;
        this.report = {
            valid: false,
            errorsDescription: []
        };
    }

    public start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.executePrePublishingFunction();
            if (this.publisher) {
                this.publisher.publish()
                    .then(() => {
                        return resolve();
                    })
                    .catch((err: any) => {
                        this.report.errorsDescription.push(`Error publishing start event '${this.publisher}'`)
                        reject(err)
                    });
            }
            else {
                const message = `Impossible to define Publisher after prePublish function execution '${this.publisher}'`;
                this.report.errorsDescription.push(message)
                reject(message);
            }
        });
    }

    public getReport(): Report {
        this.report = {
            ...this.publisherOriginalAttributes,
            prePublishFunction: this.prePublishingReport,
            timestamp: new DateController().toString(),
            valid: this.report.errorsDescription.length <= 0,
            errorsDescription: this.report.errorsDescription
        }
        return this.report;
    }

    private executePrePublishingFunction() {
        const prePublishFunction = new PrePublishMetaFunction(this.publisherOriginalAttributes);
        const functionResponse = new MetaFunctionExecutor(prePublishFunction).execute();
        if (functionResponse.publisher.payload)
            functionResponse.publisher.payload = JSON.stringify(functionResponse.publisher.payload);
        this.publisher = Container.get(Publisher).createFromPredicate(functionResponse.publisher);
        this.prePublishingReport = functionResponse.report;
    }
}