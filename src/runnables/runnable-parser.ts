import {Logger} from '../loggers/logger';
import {IdGenerator} from '../id-generator/id-generator';
import {ValidateFunction} from 'ajv';
import {JsonPlaceholderReplacer} from 'json-placeholder-replacer';
import {RunnableModel} from '../models/inputs/runnable-model';
import fs from 'fs';
import Ajv from 'ajv';
import * as yaml from 'yamljs';
import {Store} from '../testers/store';

export class RunnableParser {

    private validator: ValidateFunction;
    public constructor() {
        const schemasPath = this.discoverSchemasFolder();
        this.validator = new Ajv({allErrors: true, verbose: false})
            .addSchema(this.readJsonSchemaFile(schemasPath.concat('requisition-schema.json')))
            .compile(this.readJsonSchemaFile(schemasPath.concat('runnable-schema.json')));
    }

    private discoverSchemasFolder() {
        let realPath = process.argv[1];
        try {
            realPath = fs.realpathSync(process.argv[1]);
        } catch {
            //do nothing
        }
        const prefix = realPath.split('enqueuer')[0];
        const schemasPath = prefix.concat('enqueuer/schemas/');
        return schemasPath;
    }

    public parse(runnableMessage: string): RunnableModel {
        const parsedRunnable = this.parseToObject(runnableMessage);
        let variablesReplaced: any = this.replaceVariables(parsedRunnable);
        if (!this.validator(variablesReplaced)) {
            this.throwError();
        }
        if (!variablesReplaced.id) {
            variablesReplaced.id = new IdGenerator(variablesReplaced).generateId();
        }
        const runnableWithId: RunnableModel = variablesReplaced as RunnableModel;
        Logger.info(`Message '${runnableWithId.name}' valid and associated with id ${runnableWithId.id}`);
        return runnableWithId;
    }

    private throwError() {
        if (this.validator.errors) {
            this.validator.errors.forEach(error => {
                Logger.error(JSON.stringify(error));
            });
            if (this.validator.errors.length > 0) {
                throw Error(this.validator.errors[0].dataPath);
            }
        }
        throw Error(JSON.stringify(this.validator, null, 2));
    }

    private parseToObject(runnableMessage: string) {
        try {
            return yaml.parse(runnableMessage);
        } catch (ymlErr) {
            Logger.warning(`Not able to parse as Yaml: ${ymlErr}`);
            try {
                return JSON.parse(runnableMessage);
            } catch (jsonErr) {
                Logger.warning(`Not able to parse as Json: ${jsonErr}`);
                throw Error(JSON.stringify({ymlError: ymlErr, jsonError: jsonErr.toString()}));
            }
        }
    }

    private readJsonSchemaFile(filename: string) {
        return JSON.parse(fs.readFileSync(filename).toString());
    }

    private replaceVariables(parsedRunnable: {}): any {
        const placeHolderReplacer = new JsonPlaceholderReplacer();
        placeHolderReplacer
            .addVariableMap(Store.getData());
        return placeHolderReplacer.replace(parsedRunnable);
    }

}