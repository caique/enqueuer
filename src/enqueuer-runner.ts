import {Logger} from './loggers/logger';
import {MultiTestsOutput} from './outputs/multi-tests-output';
import * as input from './models/inputs/requisition-model';
import * as output from './models/outputs/requisition-model';
import {DateController} from './timers/date-controller';
import {RequisitionFilePatternParser} from './requisition-runners/requisition-file-pattern-parser';
import {RequisitionRunner} from './requisition-runners/requisition-runner';
import {Configuration} from './configurations/configuration';
import {RequisitionAdopter} from './components/requisition-adopter';
import {NotificationEmitter, Notifications} from './notifications/notification-emitter';
import {SummaryTestOutput} from './outputs/summary-test-output';

export class EnqueuerRunner {
    private static reportName: string = 'enqueuer';

    private readonly startTime: DateController;
    private enqueuerRequisition?: input.RequisitionModel;

    constructor() {
        this.startTime = new DateController();
        NotificationEmitter.on(Notifications.REQUISITION_RAN, (report: output.RequisitionModel) => EnqueuerRunner.printReport(report));
    }

    public async execute(): Promise<output.RequisitionModel[]> {
        Logger.setLoggerLevel('info');
        Logger.info("Let\'s rock");
        const configuration = Configuration.getInstance();
        Logger.setLoggerLevel(configuration.getLogLevel());
        const requisitionFileParser = new RequisitionFilePatternParser(configuration.getFiles());
        const requisitions = requisitionFileParser.parse();
        this.enqueuerRequisition = new RequisitionAdopter(
            {
                requisitions,
                name: EnqueuerRunner.reportName,
                timeout: -1,
                parallel: configuration.isParallel()
            }).getRequisition();
        const parsingErrors = requisitionFileParser.getFilesErrors();
        const valid = parsingErrors.length === 0;
        const finalReports = await new RequisitionRunner(this.enqueuerRequisition).run();
        Logger.info('Publishing reports');
        const outputs = new MultiTestsOutput(configuration.getOutputs());
        await finalReports.map(async report => {
            report.hooks!.onParsed = {
                valid: valid,
                tests: parsingErrors
            };
            report.valid = report.valid && valid;
            await outputs.publishReport(report);
        });
        return finalReports;
    }

    private static printReport(report: output.RequisitionModel): void {
        const configuration = Configuration.getInstance();
        if (report.level === undefined || report.level <= configuration.getMaxReportLevelPrint()) {
            try {
                if (report.level === 0) {
                    console.log(`   ----------------`);
                }

                new SummaryTestOutput(report, {
                    maxLevel: configuration.getMaxReportLevelPrint(),
                    showPassingTests: configuration.getShowPassingTests()
                }).print();
            } catch (e) {
                Logger.warning(e);
            }
        }

    }

}
