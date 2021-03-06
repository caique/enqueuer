import chalk from 'chalk';
import {TestsAnalyzer} from './tests-analyzer';
import {TestModel} from '../models/outputs/test-model';
import {RequisitionModel} from '../models/outputs/requisition-model';
import {PublisherModel} from '../models/outputs/publisher-model';
import {SubscriptionModel} from '../models/outputs/subscription-model';
import {ReportModel} from '../models/outputs/report-model';

export type SummaryOptions = {
    maxLevel: number,
    level: number,
    tabulationPerLevel: number,
    summarySpacing: number,
    showPassingTests: boolean
};

export class SummaryTestOutput {
    private readonly report: ReportModel;
    private readonly options: SummaryOptions = {
        level: 0,
        maxLevel: 100,
        tabulationPerLevel: 6,
        summarySpacing: 90,
        showPassingTests: false
    };

    public constructor(report: ReportModel, options?: any) {
        this.report = report;
        if (options && options.level !== undefined) {
            this.options.level = options.level;
        } else if (report.level) {
            this.options.level = report.level;
        }
        this.options = Object.assign({}, this.options, options);
    }

    public print(): void {
        if (this.options.maxLevel === undefined || this.options.level <= this.options.maxLevel) {
            this.printChildren();
            this.printSelf();
        }
    }

    private printChildren(): void {
        const reportLeaves = (this.report.subscriptions || [])
            .concat(this.report.publishers || []);
        for (const leaf of reportLeaves) {
            const options = Object.assign({}, this.options, {
                level: this.options.level + 1,
            });
            new SummaryTestOutput(leaf, options).print();
        }
    }

    private printSelf() {
        const testAnalyzer = new TestsAnalyzer().addTest(this.report);
        console.log(this.formatTitle(testAnalyzer) + this.createSummary(testAnalyzer));
        this.printFailingTests(this.report as any, []);
    }

    private formatTitle(testAnalyzer: TestsAnalyzer): string {
        const initialTabulation = this.createEmptyStringSized(2 * this.options.tabulationPerLevel);
        const tagTitleSeparation = this.createEmptyStringSized(this.options.level * this.options.tabulationPerLevel);
        const titleSizeSeparation: number = initialTabulation.length + 6 + tagTitleSeparation.length + this.report.name.length;
        let formattedString = initialTabulation;
        let nameColorFunction;
        if (testAnalyzer.getTests().length === 0) {
            formattedString += `${chalk.black.bgHex('#999999')('[NULL]')} `;
            nameColorFunction = chalk.hex('#999999');
        } else if (this.report.ignored || testAnalyzer.getIgnoredList().length === testAnalyzer.getTests().length) {
            formattedString += `${chalk.black.bgYellow('[SKIP]')} `;
            nameColorFunction = chalk.yellow;
        } else if (testAnalyzer.getFailingTests().length > 0) {
            formattedString += `${chalk.black.bgRed('[FAIL]')} `;
            nameColorFunction = chalk.red;
        } else { //if (this.report.valid)
            formattedString += `${chalk.black.bgGreen('[PASS]')} `;
            nameColorFunction = chalk.green;
        }
        formattedString += tagTitleSeparation;
        const iterationCounter: string = (this.report.totalIterations > 1) ? ` [${this.report.iteration}]` : '';
        formattedString += nameColorFunction(this.report.name + iterationCounter);
        formattedString += this.createEmptyStringSized(this.options.summarySpacing - titleSizeSeparation);
        return formattedString;
    }

    private createEmptyStringSized(length: number): string {
        let blank = '';
        while (--length > 0) {
            blank = blank.concat(' ');
        }
        return blank;
    }

    private createSummary(testAnalyzer: TestsAnalyzer): string {
        const percentage = testAnalyzer.getPercentage();
        const testsNumber = testAnalyzer.getNotIgnoredTests().length;
        let message = `${testAnalyzer.getPassingTests().length} tests passing of ${testsNumber} (${percentage}%)`;
        const ignoredTests = testAnalyzer.getIgnoredList();
        if (ignoredTests.length > 0) {
            message += chalk.yellow(` - ${ignoredTests.length} ignored -`);
        }
        if (this.report.time) {
            const totalTime = this.report.time.totalTime;
            message += ` ran in ${totalTime}ms`;
        }
        return this.getColor(percentage)(message);
    }

    private printFailingTests(report: ReportModel, hierarchy: string[]) {
        const passing = !report.ignored && !report.valid;
        if (passing || this.options.showPassingTests) {
            Object.keys(report.hooks || {}).forEach((key: string) => {
                report.hooks![key].tests
                    .filter((test: TestModel) => (!test.ignored && !test.valid) || this.options.showPassingTests)
                    .forEach((test: TestModel) => {
                        const initialTabulation = this.createEmptyStringSized((this.options.level + 4) * this.options.tabulationPerLevel);
                        let color;
                        if (test.ignored) {
                            color = chalk.yellow;
                        } else if (test.valid) {
                            color = chalk.green;
                        } else {
                            color = chalk.red;
                        }
                        const hierarchyTitle = initialTabulation + this.prettifyTestHierarchyMessage(hierarchy.concat(key), test.name, color);
                        console.log(hierarchyTitle);
                        const description = `${initialTabulation}${this
                            .createEmptyStringSized(2 * this.options.tabulationPerLevel)}${test.description}`;
                        console.log(color(description));
                    });

            });

            (report.subscriptions || [])
                .concat(report.publishers || [])
                .concat(report.requisitions || [])
                .forEach(((leaf: RequisitionModel | PublisherModel | SubscriptionModel) => {
                    const iterationCounter: string = (leaf.totalIterations > 1) ? ` [${leaf.iteration}]` : '';
                    this.printFailingTests(leaf, hierarchy.concat(leaf.name + iterationCounter));
                }));

        }
    }

    private getColor(percentage: number): Function {
        if (percentage == 100) {
            return chalk.green;
        } else if (percentage > 50) {
            return chalk.yellow;
        }
        return chalk.red;
    }

    private prettifyTestHierarchyMessage(hierarchy: string[], name: string, color: Function): string {
        const reducer = (result: string, level: string) => result + color(level) + chalk.gray(' › ');
        return hierarchy
            .reduce(reducer, '') + chalk.reset(name);
    }

}
