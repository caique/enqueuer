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
const net = __importStar(require("net"));
const conditional_injector_1 = require("conditional-injector");
const logger_1 = require("../loggers/logger");
let TcpPublisher = class TcpPublisher extends publisher_1.Publisher {
    constructor(publisherAttributes) {
        super(publisherAttributes);
        this.serverAddress = publisherAttributes.serverAddress;
        this.port = publisherAttributes.port;
    }
    publish() {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            logger_1.Logger.debug(`Tcp client trying to connect`);
            client.connect(this.port, this.serverAddress, () => {
                logger_1.Logger.debug(`Tcp client connected to: ${this.serverAddress}:${this.port}`);
                client.write(this.payload);
                client.on('error', (data) => {
                    reject(data);
                })
                    .on('end', () => {
                    resolve();
                })
                    .on('data', (msg) => {
                    this.messageReceived = msg.toString();
                    resolve();
                });
            });
        });
    }
};
TcpPublisher = __decorate([
    conditional_injector_1.Injectable({ predicate: (publishRequisition) => publishRequisition.type === 'tcp' }),
    __metadata("design:paramtypes", [Object])
], TcpPublisher);
exports.TcpPublisher = TcpPublisher;
