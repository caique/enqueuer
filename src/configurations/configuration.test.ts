import {Configuration} from './configuration';
import {FileConfiguration} from './file-configuration';
import {CommandLineConfiguration} from './command-line-configuration';

jest.mock('./file-configuration');
jest.mock('./command-line-configuration');

describe('Configuration', () => {
    beforeEach(() => {
        // @ts-ignore
        Configuration.loaded = false;
    });

    it('should call verifyPrematureActions', () => {
        const commandLine = createEmptyCommandLine();
        // @ts-ignore
        CommandLineConfiguration.mockImplementationOnce(() => commandLine);
        commandLine.verifyPrematureActions = jest.fn();

        const instance = Configuration.getInstance();

        expect(commandLine.verifyPrematureActions).toBeCalled();
    });

    it('should check default values', () => {
        // @ts-ignore
        CommandLineConfiguration.mockImplementationOnce(() => createEmptyCommandLine());

        const instance = Configuration.getInstance();

        expect(instance.getName()).toBe('enqueuer');
        expect(instance.isParallel()).toBeFalsy();
        expect(instance.getFiles()).toEqual([]);
        expect(instance.getLogLevel()).toBe('warn');
        expect(instance.getMaxReportLevelPrint()).toBe(2);
        expect(instance.getStore()).toEqual({});
        expect(instance.isQuiet()).toBeFalsy();
        expect(instance.getPlugins()).toEqual([]);
        expect(instance.getOutputs()).toEqual([]);
    });

    it('should work with only command line', () => {
        const commandLine = createCommandLine();
        // @ts-ignore
        CommandLineConfiguration.mockImplementationOnce(() => commandLine);

        const instance = Configuration.getInstance();

        expect(instance.getFiles()).toEqual(['cli-firstFile', 'cli-secondFile']);
        expect(instance.getLogLevel()).toBe('cli-debug');
        expect(instance.getStore()).toEqual({cliKey: 'value'});
        expect(instance.isQuiet()).toBeTruthy();
        expect(instance.getPlugins()).toEqual(['cli-amqp-plugin', 'common-plugin']);
        expect(instance.getName()).toBe('enqueuer');
        expect(instance.isParallel()).toBeFalsy();
        expect(instance.getMaxReportLevelPrint()).toBe(2);
    });

    it('should work with only conf file', () => {
        // @ts-ignore
        CommandLineConfiguration.mockImplementationOnce(() => createEmptyCommandLine('confFile'));
        // @ts-ignore
        FileConfiguration.mockImplementationOnce(() => createFileConfiguration());

        const instance = Configuration.getInstance();

        expect(instance.getName()).toBe('confFile-examples');
        expect(instance.isParallel()).toBeTruthy();
        expect(instance.getFiles()).toEqual(['confFile-1', 'confFile-2']);
        expect(instance.getLogLevel()).toBe('confFile-fatal');
        expect(instance.getMaxReportLevelPrint()).toBe(13);
        expect(instance.getStore()).toEqual({confFileStore: 'yml', confFileKey: 'file report output'});
        expect(instance.getPlugins()).toEqual(['confFile-plugin', 'confFile-plugin-2', 'common-plugin']);
        expect(instance.isQuiet()).toBeFalsy();
    });

    it('should handle file not found', () => {
        // @ts-ignore
        CommandLineConfiguration.mockImplementationOnce(() => createEmptyCommandLine('not to throw'));
        // @ts-ignore
        FileConfiguration.mockImplementationOnce(() => {
            throw 'error';
        });

        expect(() => Configuration.getInstance()).not.toThrow();
    });

    it('should merge command line with conf file', () => {
        const commandLine = createCommandLine('conf-file');
        const fileConfiguration = createFileConfiguration();
        // @ts-ignore
        CommandLineConfiguration.mockImplementationOnce(() => commandLine);
        // @ts-ignore
        FileConfiguration.mockImplementationOnce(() => fileConfiguration);

        const instance = Configuration.getInstance();

        expect(instance.getName()).toBe(fileConfiguration.getName());
        expect(instance.isParallel()).toBeTruthy();
        expect(instance.getFiles()).toEqual(fileConfiguration.getFiles().concat(commandLine.getTestFiles()));
        expect(instance.getLogLevel()).toBe(commandLine.getVerbosity());
        expect(instance.getMaxReportLevelPrint()).toBe(fileConfiguration.getMaxReportLevelPrint());
        expect(instance.getStore()).toEqual(Object.assign({}, fileConfiguration.getStore(), commandLine.getStore()));
        expect(instance.isQuiet()).toBeTruthy();
    });

    it('should ignore files', () => {
        const uniqueFiles = ['unique-file1', 'unique-file2'];
        const fileConfiguration = createFileConfiguration();
        const commandLine = createCommandLine('conf-file');
        // @ts-ignore
        commandLine.getTestFilesIgnoringOthers = () => uniqueFiles;
        // @ts-ignore
        CommandLineConfiguration.mockImplementationOnce(() => commandLine);
        // @ts-ignore
        FileConfiguration.mockImplementationOnce(() => fileConfiguration);

        const instance = Configuration.getInstance();

        expect(instance.getFiles()).toEqual(uniqueFiles);
    });

    it('should combine plugins', () => {
        const commandLine = createCommandLine('conf-file');
        const fileConfiguration = createFileConfiguration();
        const manuallyAddedPlugins = ['common-plugin', 'manuallyAddedPlugin'];
        // @ts-ignore
        CommandLineConfiguration.mockImplementationOnce(() => commandLine);
        // @ts-ignore
        FileConfiguration.mockImplementationOnce(() => fileConfiguration);

        const configuration = Configuration.getInstance();
        manuallyAddedPlugins.forEach(plugin => configuration.addPlugin(plugin));

        const confPlugins = configuration.getPlugins();
        const uniquePlugins = [...new Set(commandLine.getPlugins()
            .concat(fileConfiguration.getPlugins())
            .concat(manuallyAddedPlugins))];
        expect(confPlugins.length).toBe(uniquePlugins.length);
        confPlugins.forEach(confPlugin => expect(uniquePlugins).toContainEqual(confPlugin));
    });

    it('should create cli output formatter', () => {
        const commandLine = createCommandLine();
        commandLine.getStdoutRequisitionOutput = () => true;
        // @ts-ignore
        CommandLineConfiguration.mockImplementationOnce(() => commandLine);

        const instance = Configuration.getInstance();

        expect(instance.getOutputs()).toEqual([{format: 'console', name: 'command line report output', type: 'standard-output'}]);
    });

    const createEmptyCommandLine = (filename?: string) => {
        return {
            verifyPrematureActions: () => true,
            getConfigFileName: () => filename,
            getTestFiles: () => undefined,
            getVerbosity: () => undefined,
            getPlugins: () => undefined,
            getStore: () => undefined,
            isQuietMode: () => undefined,
            getTestFilesIgnoringOthers: () => undefined,
            getStdoutRequisitionOutput: () => false,
        };
    };

    const createCommandLine = (filename?: string) => {
        return {
            verifyPrematureActions: () => true,
            getConfigFileName: () => filename,
            getTestFiles: () => ['cli-firstFile', 'cli-secondFile'],
            getVerbosity: () => 'cli-debug',
            getPlugins: () => ['cli-amqp-plugin', 'common-plugin'],
            getStore: () => {
                return {
                    cliKey: 'value'
                };
            },
            isQuietMode: () => true,
            getTestFilesIgnoringOthers: () => undefined,
            getStdoutRequisitionOutput: () => true,
        };
    };

    const createFileConfiguration = () => {
        return {
            getLogLevel: () => 'confFile-fatal',
            getOutputs: () => {
                return {type: 'confFile-type', format: 'yml', name: 'confFile report output'};
            },
            getStore: () => {
                return {confFileStore: 'yml', confFileKey: 'file report output'};
            },
            getPlugins: () => ['confFile-plugin', 'confFile-plugin-2', 'common-plugin'],
            getName: () => 'confFile-examples',
            isParallelExecution: () => true,
            getFiles: () => ['confFile-1', 'confFile-2'],
            getMaxReportLevelPrint: () => 13,
        };
    };

});
