"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
Object.defineProperty(exports, "__esModule", { value: true });
const publisher_1 = require("./publisher");
const logger_1 = require("../loggers/logger");
const conditional_injector_1 = require("conditional-injector");
const zmq = __importStar(require("zeromq"));
let ZeroMqPubPublisher = class ZeroMqPubPublisher extends publisher_1.Publisher {
    constructor(publish) {
        super(publish);
        this.address = publish.address;
        this.topic = publish.topic;
        this.socket = zmq.socket('pub');
    }
    publish() {
        return new Promise((resolve) => {
            logger_1.Logger.debug('Binding socket to publish to zeroMq');
            this.socket = this.socket.bindSync(this.address);
            setTimeout(() => {
                logger_1.Logger.debug(`Bound and publishing to zeroMq socket topic ${this.topic} and message ${this.payload}`);
                this.socket = this.socket.send([this.topic, this.payload]);
                this.socket.close();
                resolve();
            }, 250);
        });
    }
};
ZeroMqPubPublisher = __decorate([
    conditional_injector_1.Injectable({ predicate: (publishRequisition) => publishRequisition.type === 'zero-mq-pub' }),
    __metadata("design:paramtypes", [Object])
], ZeroMqPubPublisher);
exports.ZeroMqPubPublisher = ZeroMqPubPublisher;
