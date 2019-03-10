import {CommandLineConfiguration} from './command-line-configuration';
import {FileConfiguration} from './file-configuration';
import {PublisherModel} from '../models/inputs/publisher-model';
import {Logger} from '../loggers/logger';
import prettyjson from 'prettyjson';
import {getPrettyJsonConfig} from '../outputs/prettyjson-config';

export class Configuration {
    private static instance: Configuration;
    private static loaded: boolean = false;

    private parallel: boolean = false;
    private files: string[] = [];
    private logLevel: string = 'warn';
    private outputs: PublisherModel[] = [];
    private maxReportLevelPrint: number = 1;
    private store: any = {};
    private plugins: string[] = [];
    private commandLineConfiguration: CommandLineConfiguration;

    private constructor() {
        this.commandLineConfiguration = new CommandLineConfiguration(process.argv);
        const fileName = this.commandLineConfiguration.getConfigFileName();
        this.adjustFromFile(fileName);
        this.adjustFromCommandLine();
    }

    public static getInstance(): Configuration {
        if (Configuration.loaded === false) {
            Configuration.loaded = true;
            Configuration.instance = new Configuration();
            Configuration.instance.commandLineConfiguration.verifyPrematureActions();
            if (Configuration.instance.logLevel === 'trace') {
                this.printConfiguration();
            }
        }
        return Configuration.instance;
    }

    public addPlugin(pluginName: string): Configuration {
        Logger.info(`Plugin added to the list: ${pluginName}`);
        const plugins: Set<string> = new Set(this.plugins);
        plugins.add(pluginName);
        this.plugins = Array.from(plugins.values());
        return this;
    }

    public isParallel(): boolean {
        return this.parallel;
    }

    public getFiles(): string[] {
        return this.files;
    }

    public getLogLevel(): string {
        return this.logLevel;
    }

    public getOutputs(): PublisherModel[] {
        return this.outputs;
    }

    public getMaxReportLevelPrint(): number {
        return this.maxReportLevelPrint;
    }

    public getStore(): any {
        return this.store;
    }

    public getPlugins(): string[] {
        return this.plugins;
    }

    private adjustFromCommandLine(): void {
        this.files = this.files.concat(this.commandLineConfiguration.getTestFiles() || []);

        this.logLevel = this.commandLineConfiguration.getVerbosity() || this.logLevel;
        this.plugins = [...new Set(this.plugins.concat(this.commandLineConfiguration.getPlugins() || []))];
        this.store = Object.assign({}, this.store, this.commandLineConfiguration.getStore());
        const filesIgnoringOthers = this.commandLineConfiguration.getTestFilesIgnoringOthers();
        if (filesIgnoringOthers && filesIgnoringOthers.length > 0) {
            this.files = filesIgnoringOthers;
        }
        if (this.commandLineConfiguration.getStdoutRequisitionOutput() !== false) {
            this.outputs.push({type: 'standard-output', format: 'console', name: 'command line report output'});
        }
        const fileMaxReportLevelPrint = this.commandLineConfiguration.getMaxReportLevelPrint();
        if (fileMaxReportLevelPrint !== undefined) {
            this.maxReportLevelPrint = fileMaxReportLevelPrint;
        }

    }

    private adjustFromFile(filename?: string) {
        if (filename !== undefined) {
            try {
                const fileConfiguration = new FileConfiguration(filename);
                if (fileConfiguration) {
                    this.parallel = fileConfiguration.isParallelExecution() || this.parallel;
                    this.logLevel = fileConfiguration.getLogLevel() || this.logLevel;
                    this.files = this.files.concat(fileConfiguration.getFiles());
                    this.outputs = this.outputs.concat(fileConfiguration.getOutputs());
                    this.plugins = this.plugins.concat(fileConfiguration.getPlugins());
                    this.store = Object.assign({}, fileConfiguration.getStore(), this.store);
                    const fileMaxReportLevelPrint = fileConfiguration.getMaxReportLevelPrint();
                    if (fileMaxReportLevelPrint !== undefined) {
                        this.maxReportLevelPrint = fileMaxReportLevelPrint;
                    }
                }
            } catch (err) {
                Logger.error(err);
            }
        }
    }

    private static printConfiguration() {
        const configuration = JSON.parse(JSON.stringify(Configuration.instance));
        delete configuration.commandLineConfiguration;
        console.log(prettyjson.render({configuration: configuration}, getPrettyJsonConfig()));
    }

}
