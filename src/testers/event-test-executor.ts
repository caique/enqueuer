import {Event, Assertion} from './event';
import {Test} from './test';
import {Tester} from './tester';
import {AssertionCodeGenerator} from './assertion-code-generator';
import {ScriptExecutor} from './script-executor';
import {Store} from "./store";

export class EventTestExecutor {
    private arguments: {name: string, value: any}[] = [];
    private assertions: Assertion[] = [];
    private script: string = '';

    public constructor(event?: Event) {
        if (event) {
            this.script = event.script || '';
            this.assertions = event.assertions || [];
        }
    }

    public addArgument(name: string, value: any): void {
        this.arguments.push({name: name, value: value});
    }

    public execute(): Test[] {
        let result: Test[] = [];

        try {
            result = this.scriptRunner(this.script);
        } catch (err) {
            return [{valid: false, label: 'Script code is valid', description: err}];
        }
        return this.testEachAssertion(result);
    }

    private testEachAssertion(initial: Test[]) {
        let result: Test[] = [];

        this.assertions.forEach(assertion => {
            try {
                result = result.concat(this.runAssertion(assertion));
            } catch (err) {
                result = result.concat({valid: false, label: `Assertion ${assertion.label} code is valid`, description: err});
            }
        });
        return initial.concat(result);
    }

    private runAssertion(assertion: Assertion): Test[] {
        const assertionCodeGenerator: AssertionCodeGenerator = new AssertionCodeGenerator('tester');
        const code = assertionCodeGenerator.generate(assertion);
        return this.scriptRunner(this.script + code);
    }

    private scriptRunner(script: string): Test[] {
        const scriptExecutor = new ScriptExecutor(script);

        let tester = new Tester();

        scriptExecutor.addArgument('store', Store.getData());
        scriptExecutor.addArgument('tester', tester);
        this.arguments.forEach(argument => {
            scriptExecutor.addArgument(argument.name, argument.value);
        });

        scriptExecutor.execute();
        return tester.getReport();
    }

}