import {Publisher} from "./publisher";

export class UdsPublisher extends Publisher {

    private path: string;
    private serverId: string;
    private ipc = require('node-ipc');

    constructor(publisherAttributes: any) {
        super(publisherAttributes);
        this.serverId = publisherAttributes.serverId;
        this.path = publisherAttributes.path;
        this.ipc.config.silent = true;

    }

    publish(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.ipc.connectTo(this.serverId, (client: any) => {
                client.of[this.serverId].on('connect', () => {
                    client.of[this.serverId].emit(this.path, this.payload);
                    client.of[this.serverId].disconnect();
                    this.ipc.disconnect(this.serverId);
                    resolve();
                });
                client.of[this.serverId].on('error', (error: any) => {
                    this.ipc.disconnect(this.serverId);
                    reject(error);
                });
            });
        });
    }
}