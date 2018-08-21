"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../loggers/logger");
class ScriptExecutor {
    constructor(functionBody) {
        this.arguments = [];
        this.functionBody = functionBody;
    }
    addArgument(name, value) {
        this.arguments.push({ name: name, value: value });
    }
    execute() {
        return this.executeFunction(this.createFunction());
    }
    createFunction() {
        const constructorArgs = this.arguments.map(arg => arg.name).concat(this.functionBody);
        return ((...args) => new Function(...args)).apply(null, constructorArgs);
    }
    executeFunction(dynamicFunction) {
        try {
            const callArgs = this.arguments.map(arg => arg.value);
            return dynamicFunction.apply(this, callArgs);
        }
        catch (err) {
            logger_1.Logger.error(`Error with function: ${dynamicFunction}`);
            throw err;
        }
    }
}
exports.ScriptExecutor = ScriptExecutor;
