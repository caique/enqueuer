import {CommandLineConfiguration} from './command-line-configuration';
import {DynamicModulesManager} from '../plugins/dynamic-modules-manager';
import {TestsDescriber} from '../testers/tests-describer';

jest.mock('../testers/tests-describer');
jest.mock('../plugins/dynamic-modules-manager');

const describeProtocolsMock = jest.fn(() => true);
const describeReportFormattersMock = jest.fn(() => true);
const describeObjectParsersMock = jest.fn(() => false);
DynamicModulesManager.getInstance.mockImplementation(() => {
    return {
        getProtocolManager: () => {
            return {
                describeProtocols: describeProtocolsMock
            };
        },
        getReportFormatterManager: () => {
            return {
                describeReportFormatters: describeReportFormattersMock
            };
        },
        getObjectParserManager: () => {
            return {
                describeObjectParsers: describeObjectParsersMock
            };
        }

    };
});

const exitMock = jest.fn();
describe('CommandLineConfiguration', () => {
    beforeEach(() => {
        describeProtocolsMock.mockClear();
        describeReportFormattersMock.mockClear();
        describeObjectParsersMock.mockClear();

        exitMock.mockClear();
        // @ts-ignore
        process.exit = exitMock;
    });

    it('verbosity -b', () => {
        const logLevel = 'info';
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '-b', logLevel]);

        expect(commandLineConfiguration.getVerbosity()).toBe(logLevel);
    });

    it('verbosity --verbosity', () => {
        const logLevel = 'info';
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '--verbosity', logLevel]);

        expect(commandLineConfiguration.getVerbosity()).toBe(logLevel);
    });

    it('verbosity -m', () => {
        const maxLevel = '3';
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '-m', maxLevel]);

        expect(commandLineConfiguration.getMaxReportLevelPrint()).toBe(maxLevel);
    });

    it('verbosity --max-report-level-print', () => {
        const maxLevel = '3';
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '--max-report-level-print', maxLevel]);

        expect(commandLineConfiguration.getMaxReportLevelPrint()).toBe(maxLevel);
    });

    it('verbosity --max-report-level-print default', () => {
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test']);

        expect(commandLineConfiguration.getMaxReportLevelPrint()).toBeUndefined();
    });

    it('undefined logLevel', () => {
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test']);

        expect(commandLineConfiguration.getVerbosity()).toBe('warn');
    });

    it('default console output', () => {
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test']);

        expect(commandLineConfiguration.getStdoutRequisitionOutput()).toBeFalsy();
    });

    it('set console output -o', () => {
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '-o']);

        expect(commandLineConfiguration.getStdoutRequisitionOutput()).toBeTruthy();
    });

    it('set console output --stdout-requisition-output', () => {
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '--stdout-requisition-output']);

        expect(commandLineConfiguration.getStdoutRequisitionOutput()).toBeTruthy();
    });

    it('getConfigFileName -c', () => {
        const configFile = 'minusC';
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '-c', configFile]);

        expect(commandLineConfiguration.getConfigFileName()).toBe(configFile);
    });

    it('getConfigFileName --config-file', () => {
        const configFile = 'configFile';
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '--config-file', configFile]);

        expect(commandLineConfiguration.getConfigFileName()).toBe(configFile);
    });

    it('describe protocols -p', () => {
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '-p']);
        commandLineConfiguration.verifyPrematureActions();

        expect(exitMock).toHaveBeenCalledWith(0);
        expect(describeProtocolsMock).toHaveBeenCalledWith(true);
    });

    it('describe protocols --protocols-description', () => {
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '--protocols-description']);

        commandLineConfiguration.verifyPrematureActions();

        expect(exitMock).toHaveBeenCalledWith(0);
        expect(describeProtocolsMock).toHaveBeenCalledWith(true);
    });

    it('describe protocols --protocols-description http', () => {
        const params = 'http';
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '--protocols-description', params]);

        commandLineConfiguration.verifyPrematureActions();

        expect(exitMock).toHaveBeenCalledWith(0);
        expect(describeProtocolsMock).toHaveBeenCalledWith(params);
    });

    it('describe formatters -f', () => {
        const params = 'json';
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '-f', params]);

        commandLineConfiguration.verifyPrematureActions();

        expect(exitMock).toHaveBeenCalledWith(0);
        expect(describeReportFormattersMock).toHaveBeenCalledWith(params);
    });

    it('describe formatters --formatters-description', () => {
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '--formatters-description']);

        commandLineConfiguration.verifyPrematureActions();

        expect(exitMock).toHaveBeenCalledWith(0);
        expect(describeReportFormattersMock).toHaveBeenCalledWith(true);
    });

    it('describe parsers list -e', () => {
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '-e']);

        commandLineConfiguration.verifyPrematureActions();

        expect(exitMock).toHaveBeenCalledWith(1);
        expect(describeObjectParsersMock).toHaveBeenCalledWith(true);
    });

    it('describe --parsers-list', () => {
        const params = 'csv';
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '--parsers-list', params]);

        commandLineConfiguration.verifyPrematureActions();

        expect(exitMock).toHaveBeenCalledWith(1);
        expect(describeObjectParsersMock).toHaveBeenCalledWith(params);
    });

    it('describe assertions -t', () => {
        const describeTestMock = jest.fn(() => false);
        // @ts-ignore
        TestsDescriber.mockImplementationOnce(() => {
            return {
                describeTests: describeTestMock
            };
        });
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '-t']);

        commandLineConfiguration.verifyPrematureActions();

        expect(exitMock).toHaveBeenCalledWith(0);
        expect(describeTestMock).toHaveBeenCalledWith();
    });

    it('describe assertions --tests-list', () => {
        const describeTestMock = jest.fn();
        // @ts-ignore
        TestsDescriber.mockImplementationOnce(() => {
            return {
                describeTests: describeTestMock
            };
        });

        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '--tests-list']);

        commandLineConfiguration.verifyPrematureActions();

        expect(exitMock).toHaveBeenCalledWith(0);
        expect(describeTestMock).toHaveBeenCalledWith();
    });

    it('no file', () => {
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test']);

        expect(commandLineConfiguration.getTestFiles()).toEqual([]);
        expect(commandLineConfiguration.getTestFilesIgnoringOthers()).toEqual([]);
    });

    it('add file <no dash>', () => {
        const testFile1 = 'filename1';
        const testFile2 = 'filename2';
        const commandLineConfiguration = new CommandLineConfiguration(
            ['node', 'test', '--some', 'test', testFile1, '--other', 'stuff', testFile2]);

        expect(commandLineConfiguration.getTestFiles().sort()).toEqual([testFile2, testFile1].sort());
    });

    it('add test file', () => {
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '-a', 'file', '--add-file', 'file2']);

        expect(commandLineConfiguration.getTestFiles()).toEqual(['file', 'file2']);
    });

    it('add plugin', () => {
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '-l', 'plugin1', '--add-plugin', 'plugin2']);

        expect(commandLineConfiguration.getPlugins()).toEqual(['plugin1', 'plugin2']);
    });

    it('render help', () => {
        const consoleMock = jest.fn();
        console.log = consoleMock;
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '-h']);
        expect(consoleMock).toHaveBeenCalled();
    });

    it('get version', () => {
        const packageJson = require('../../package.json');

        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '-v']);

        expect(commandLineConfiguration.getVersion()).toBe(packageJson.version);
    });

    it('add test file ignoring', () => {
        const commandLineConfiguration = new CommandLineConfiguration(['node', 'test', '-A', 'file', '--add-file-and-ignore-others', 'file2']);

        expect(commandLineConfiguration.getTestFilesIgnoringOthers()).toEqual(['file', 'file2']);
    });

    it('handle null process.argv', () => {
        // @ts-ignore
        expect(() => new CommandLineConfiguration()).toThrow();
    });

    it('getStore -s', () => {
        const option = ['-s', '--store'];
        const store: any = {
            key: 'value',
            'composed-name': 'stuff',
            number: '10'
        };
        const newArguments = ['node', 'test'];
        Object.keys(store).forEach((key, index) => {
            newArguments.push(option[index % option.length]);
            newArguments.push(key + '=' + store[key]);
        });
        const commandLineConfiguration = new CommandLineConfiguration(newArguments);

        expect(commandLineConfiguration.getStore()).toEqual(store);
    });

});
