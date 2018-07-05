import {Publisher} from './publisher';
import {Logger} from '../loggers/logger';
import {Injectable} from 'conditional-injector';
import {PublisherModel} from '../models/inputs/publisher-model';
import * as zmq from 'zeromq';

@Injectable({predicate: (publishRequisition: any) => publishRequisition.type === 'zero-mq-pub'})
export class ZeroMqPubPublisher extends Publisher {
    private address: string;
    private topic: string;
    private socket: zmq.Socket;

    constructor(publish: PublisherModel) {
        super(publish);
        this.address = publish.address;
        this.topic = publish.topic;
        this.socket = zmq.socket('pub');
    }

    public publish(): Promise<void> {
        return new Promise((resolve) => {
            Logger.debug('Binding socket to publish to zeroMq');
            this.socket = this.socket.bindSync(this.address);

            setTimeout(() => {
                Logger.debug(`Bound and publishing to zeroMq socket topic ${this.topic} and message ${this.payload}`);
                this.socket = this.socket.send([this.topic, this.payload]);
                this.socket.close();
                resolve();
            }, 250);
        });
    }
}