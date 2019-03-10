import chalk from 'chalk';
import {AnalyzedTest, TestsAnalyzer} from './tests-analyzer';
import {ReportModel} from '../models/outputs/report-model';

export class SummaryTestOutput {
    private static readonly NAME_SPACING = 120;
    private static readonly LEVEL_TABULATION = 8;
    private readonly report: ReportModel;
    private readonly level: number;
    private readonly maxLevel?: number;

    public constructor(report: ReportModel, maxLevel?: number, level: number = 0) {
        this.report = report;
        this.level = level;
        this.maxLevel = maxLevel;
    }

    public print(): void {
        if (this.maxLevel === undefined || this.level <= this.maxLevel) {
            this.printChildren();
            this.printSelf();
        }
    }

    private printChildren() {
        const reportLeaves = (this.report.subscriptions || []).concat(this.report.publishers || []);
        for (const leaf of reportLeaves) {
            new SummaryTestOutput(leaf, this.maxLevel, this.level + 1).print();
        }
    }

    private printSelf() {
        const testAnalyzer = new TestsAnalyzer().addTest(this.report);
        console.log(this.formatTitle(testAnalyzer) + this.createSummary(testAnalyzer));
        if (testAnalyzer.getFailingTests().length > 0) {
            this.printFailingTests(testAnalyzer);
        }
    }

    private formatTitle(testAnalyzer: TestsAnalyzer): string {
        const tabulation = this.level * SummaryTestOutput.LEVEL_TABULATION;
        let formattedString = '\t' + this.createEmptySpaceUntilTotalLength(0, tabulation);
        if (this.report.ignored || testAnalyzer.getNotIgnoredTests().length === 0) {
            formattedString += `${chalk.black.bgYellow('[SKIP]')} `;
            formattedString += chalk.yellow(this.report.name);
        } else if (this.report.valid) {
            formattedString += `${chalk.black.bgGreen('[PASS]')} `;
            formattedString += chalk.green(this.report.name);
        } else {
            formattedString += `${chalk.black.bgRed('[FAIL]')} `;
            formattedString += chalk.red(this.report.name);
        }
        formattedString += this.createEmptySpaceUntilTotalLength(formattedString.length, SummaryTestOutput.NAME_SPACING);
        return formattedString;
    }

    private createEmptySpaceUntilTotalLength(initialLength: number, length: number): string {
        let blank = '';
        while (initialLength + blank.length < length) {
            blank = blank.concat(' ');
        }
        return blank;
    }

    private createSummary(testAnalyzer: TestsAnalyzer): string {
        const percentage = testAnalyzer.getPercentage();
        const testsNumber = testAnalyzer.getTests().length;
        let message = `${testAnalyzer.getPassingTests().length} tests passing of ${testsNumber} (${percentage}%)`;
        const ignoredTests = testAnalyzer.getIgnoredList();
        if (ignoredTests.length > 0) {
            message += ` - ${ignoredTests.length} ignored -`;
        }
        if (this.report.time) {
            const totalTime = this.report.time.totalTime;
            message += ` ran in ${totalTime}ms`;
        }
        return this.getColor(percentage)(message);
    }

    private printFailingTests(testAnalyzer: TestsAnalyzer) {
        testAnalyzer.getFailingTests()
            .forEach((failingTest: AnalyzedTest) => {
                let message = '\t\t\t';
                message += this.prettifyTestHierarchyMessage(failingTest.hierarchy, failingTest.name, chalk.red);
                console.log(message);
                console.log(chalk.red(`\t\t\t\t\t ${failingTest.description}`));
            });
    }

    private getColor(percentage: number): Function {
        if (percentage == 100) {
            return chalk.green;
        } else if (percentage > 50) {
            return chalk.yellow;
        }
        return chalk.red;
    }

    private prettifyTestHierarchyMessage(hierarchy: string[], name: string, color: Function) {
        if (!hierarchy || hierarchy.length == 0) {
            return '';
        }
        return hierarchy.map((level: string) => color(level)).join(chalk.gray(' › ')) + chalk.gray(' › ') + chalk.reset(name);
    }

}
