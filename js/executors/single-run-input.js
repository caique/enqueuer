"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const subscription_reporter_1 = require("../reporters/subscription/subscription-reporter");
const runnable_parser_1 = require("../runnables/runnable-parser");
class SingleRunInput {
    constructor(fileNamePattern) {
        this.executorTimeout = null;
        this.subscriptionReporter = new subscription_reporter_1.SubscriptionReporter({
            type: 'file-name-watcher',
            name: 'SingleRunInput',
            fileNamePattern: fileNamePattern,
            timeout: 1000
        });
        this.runnableParser = new runnable_parser_1.RunnableParser();
    }
    syncDir() {
        return this.subscriptionReporter.connect();
    }
    onNoMoreFilesToBeRead(executorTimeout) {
        this.executorTimeout = executorTimeout;
    }
    receiveRequisition() {
        if (this.executorTimeout)
            this.subscriptionReporter.startTimeout(this.executorTimeout);
        return this.subscriptionReporter
            .receiveMessage()
            .then((unparsed) => this.runnableParser.parse(unparsed));
    }
}
exports.SingleRunInput = SingleRunInput;