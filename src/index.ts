import { MqttRequisitionFileParser } from "./mqtt/mqtt-requisition-file-parser";
import { MqttService, MqttServiceCallback } from "./mqtt/mqtt-service";

class Startup {

  private mqttService: MqttService;

  constructor() {
    const mqttRequisitionFileParser = new MqttRequisitionFileParser().parse("requisition");
    this.mqttService = new MqttService(mqttRequisitionFileParser, () => this.onFinish);
  }

  public start(): number {
    console.log("start");
    this.mqttService.start();
    return 0;
  } 

  private onFinish(): void {
    console.log("over");
  }
  
}

new Startup().start();