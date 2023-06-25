import * as amqp from "amqplib";
import { ConsumeMessage } from "amqplib";
import { IPhase, FilePhases } from "@gpt-team/phases";
import { MessageBus } from "@gpt-team/channel";
import { createDbs } from "./dbs";
import { createConsumer } from './consume'
import path from "path";

const rabbitmqUrl = "amqp://localhost";

// Function to process project descriptions and generate use cases
export async function processPhases() {
  // Db
  const basePath = path.join(process.cwd(), "agents", "ui-agent", "db");
  const dbs = createDbs(basePath);

  // RabbitMQ connection URL  
  try {
    const msgBus = new MessageBus(rabbitmqUrl)

    // Connect to RabbitMQ
    const connection = await msgBus.connect()
    const channel = await msgBus.getChannel();

    // Ensure the queue exists
    console.log("Agent is waiting for messages...");

    const phasesPath = path.join(basePath, "phases");
    const phases = new FilePhases(phasesPath);
    let phase: IPhase

    const isPhaseDone = ({body, phase }: any) => {
      return body.message == 'DONE' && body.phase === phase.name && body.sender == 'ui'
    }

    const isUiDone = ({body, phase }: any) => {
      return body.message == 'UI DONE' && body.sender == 'ui'
    }

    channel.consume('status', async (cmsg: ConsumeMessage) => {
      const body = await channel.parse(cmsg)
      if (isPhaseDone({body, phase})) {
        phase = await phases.nextPhase()
      }

      if (isUiDone({body, phase })) {
        phases.setDone()
      }
    })

    const chn = channel.getRawChannel()

    while (!phases.isDone()) {
      phase = await phases.nextPhase();
      const task = await phases.nextTask();
      // from config.yaml in task folder
      const config = await task.getConfig();
      const { subscribe } = config.channels || {};
      for (var sub of subscribe) {
        const consume = createConsumer({channel, dbs, task, config})
        await chn.assertQueue(sub);
        // create subscription
        channel.consume(sub, consume)
      }
    }
    await chn.close();
    await connection.close();

  } catch (error) {
    console.error("Error occurred:", error);
  }
}

// Start processing project descriptions
processPhases();
