import {RunnableParser} from "./runnable-parser";

const validRunnable =
    {
        runnableVersion: "01.00.00",
        name: "name",
        initialDelay: 10,
        runnables: [
            {
                timeout: 3000,
                name: "name",
                subscriptions: [
                    {
                        name: "name",
                        type: "uds",
                        path: "/tmp/unix.sock",
                        timeout: 500
                    }
                ],
                startEvent: {
                    publisher: {
                        name: "name",
                        type: "uds",
                        path: "/tmp/unix.sock",
                        payload: "{{sessionKey}}"
                    }
                }
            },
            {
                runnableVersion: "01.00.00",
                name: "name",
                initialDelay: 3000,
                runnables: [
                    {
                        runnableVersion: "01.00.00",
                        name: "name",
                        initialDelay: 10,
                        runnables: [
                            {
                                timeout: 3000,
                                name: "name",
                                subscriptions: [
                                    {
                                        name: "name",
                                        type: "uds",
                                        path: "/tmp/unix.sock",
                                        timeout: 500
                                    }
                                ],
                                startEvent: {
                                    publisher: {
                                        name: "name",
                                        type: "uds",
                                        path: "/tmp/unix.sock",
                                        payload: "{{sessionKey}}"
                                    }
                                }
                            },
                            {
                                runnableVersion: "01.00.00",
                                name: "name",
                                initialDelay: 3000,
                                runnables: []
                            }
                        ]
                    }
                ]
            }
        ]
    };

const validFileRunnable = {
    "runnableVersion": "01.00.00",
    "name": "runnableFile",
    "initialDelay": 0,
    "runnables": [
        {
            "timeout": 3000,
            "name": "file",
            "subscriptions": [
                {
                    "type": "file-name-watcher",
                    "name": "fileSubscription",
                    "fileNamePattern": "temp/fileTest*file",
                    "onMessageReceived": "const now = new Date().getTime(); test['some time has passed'] = now + '' >= message; report['something'] = now;",
                    "timeout": 1000
                }
            ],
            "startEvent": {
                "publisher": {
                    "type": "file",
                    "name": "filePublisher",
                    "payload": "filePublisher",
                    "filenamePrefix": "temp/fileTest",
                    "filenameExtension": "file",
                    "prePublishing": "publisher.payload=new Date().getTime();"
                }
            }
        }
    ]
}
const validAmqpRunnable = {
    "runnableVersion": "01.00.00",
    "name": "runnableAmqp",
    "initialDelay": 0,
    "runnables": [
        {
            "timeout": 3000,
            "name": "AmqpReq",
            "subscriptions": [
                {
                    "type": "amqp",
                    "name": "AmqpSubs",
                    "options": {
                        "host": "localhost",
                        "port": 5672
                    },
                    "queueName": "enqueuerQueue",
                    "onMessageReceived": "test['works'] = new Date().getTime() + '' >= message; report['virgs'] = 'lopídio';",
                    "timeout": 1000
                }
            ],
            "startEvent": {
                "publisher": {
                    "type": "amqp",
                    "name": "AmqpPub",
                    "options": {
                        "host": "localhost",
                        "port": 5672
                    },
                    "payload": "enqueuerQueue",
                    "queueName": "enqueuerQueue",
                    "prePublishing": "publisher.payload=new Date().getTime();"
                }
            }
        }
    ]
}
const validUdsRunnable = {
    "runnableVersion": "01.00.00",
    "name": "runnableUDSName",
    "initialDelay": 0,
    "runnables": [
        {
            "timeout": 3000,
            "name": "uds",
            "subscriptions": [
                {
                    "type": "uds",
                    "path": "/tmp/unix.sock",
                    "name": "udsSubscription",
                    "onMessageReceived": "test['first letter'] = message.substring(1,2) === 'e'; console.log('Message: ' + message)",
                    "timeout": 500
                }
            ],
            "startEvent": {
                "publisher": {
                    "type": "uds",
                    "name": "udsPublisher",
                    "path": "/tmp/unix.sock",
                    "payload": "enqueuer"
                }
            }
        }
    ]
}
const validHttpRunnable = {
    "runnableVersion": "01.00.00",
    "name": "runnableHttp",
    "initialDelay": 0,
    "runnables": [
        {
            "timeout": 30000,
            "name": "HttpTitle",
            "subscriptions": [
                {
                    "type": "http-server",
                    "name": "HttpSubscriptionTitle",
                    "endpoint": "/enqueuer",
                    "port": 23075,
                    "method": "POST",
                    "response": {
                        "status": 200
                    },
                    "onMessageReceived": "test['works'] = JSON.parse(message).enqueuer === 'virgs';",
                    "timeout": 10000
                }
            ],
            "startEvent": {
                "publisher": {
                    "type": "http-client",
                    "name": "HttpPublisherClientTitle",
                    "url": "http://localhost:23075/enqueuer",
                    "method": "POST",
                    "payload": {
                        "enqueuer": "virgs"
                    },
                    "headers": {
                        "content-type": "application/json"
                    }
                }
            }
        }
    ]
}
const validMqttRunnable = {
    "runnableVersion": "01.00.00",
    "name": "runnableMqtt",
    "initialDelay": 0,
    "runnables": [
        {
            "timeout": 3000,
            "name": "RequisitionMqtt",
            "subscriptions": [
                {
                    "type": "mqtt",
                    "brokerAddress": "mqtt://localhost",
                    "name": "MqttSub",
                    "topic": "enqueuer",
                    "onMessageReceived": "test['works'] = message = 'message';",
                    "options": {
                        "clientId": "enqueuerPublishOptionsExampleId"
                    },
                    "timeout": 1000
                }
            ],
            "startEvent": {
                "publisher": {
                    "type": "mqtt",
                    "name": "MqttPub",
                    "brokerAddress": "mqtt://localhost",
                    "payload": "enqueuer",
                    "topic": "enqueuer",
                    "options": {
                        "clientId": "enqueuerPublishOptionsExampleId"
                    }
                }
            }
        }
    ]
}


describe('RunnableParser', () => {

    it('Should not parse invalid json', () => {
        const runnable = "invalidJson";
        const parser: RunnableParser = new RunnableParser();

        expect(() => parser.parse(runnable)).toThrow()
    });

    it('Should not parse invalid requisition', () => {
        const runnable = "{\"invalid\": \"runnable\"}";
        const parser: RunnableParser = new RunnableParser();

        expect(() => parser.parse(runnable)).toThrow()
    });

    it('Should accept valid stringified json', () => {
        const runnableStringified: string = JSON.stringify(validRunnable);
        const parser: RunnableParser = new RunnableParser();

        expect(parser.parse(runnableStringified)).not.toBeNull();
    });

    it('Should accept file runnable', () => {
        expect(new RunnableParser().parse(JSON.stringify(validFileRunnable))).not.toBeNull();
    });

    it('Should accept amqp runnable', () => {
        expect(new RunnableParser().parse(JSON.stringify(validAmqpRunnable))).not.toBeNull();
    });

    it('Should accept uds runnable', () => {
        expect(new RunnableParser().parse(JSON.stringify(validUdsRunnable))).not.toBeNull();
    });

    it('Should accept http runnable', () => {
        expect(new RunnableParser().parse(JSON.stringify(validHttpRunnable))).not.toBeNull();
    });

    it('Should accept mqtt runnable', () => {
        expect(new RunnableParser().parse(JSON.stringify(validMqttRunnable))).not.toBeNull();
    });

});