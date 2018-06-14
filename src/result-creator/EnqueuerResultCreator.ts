import {ResultModel} from "../models/outputs/result-model";
import {Injectable} from "conditional-injector";
import {ResultCreator} from "./ResultCreator";
import {SingleRunResultModel} from "../models/outputs/single-run-result-model";
import * as fs from "fs";

@Injectable({predicate: (resultCreatorAttributes: any) => resultCreatorAttributes && resultCreatorAttributes.type === "enqueuer"})
export class EnqueuerResultCreator extends ResultCreator {
    private report: SingleRunResultModel;

    public constructor(resultCreatorAttributes: any) {
        super();
        this.report = {
            name: resultCreatorAttributes.filename,
            tests: {},
            valid: true,
            runnables: {}
        };

    }
    public addTestSuite(suite: ResultModel): void {
        this.report.runnables[suite.name] = suite;
        this.report.valid = this.report.valid && suite.valid;
    }
    public addError(err: any): void {
        this.report.valid = false;
    }

    public isValid(): boolean {
        return this.report.valid;
    }
    public create(): void {
        fs.writeFileSync(this.report.name, JSON.stringify(this.report, null, 4));
    }
}