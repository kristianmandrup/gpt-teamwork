import * as amqp from "amqplib";
import { FilePhases } from "@gpt-team/phases";
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
    // Connect to RabbitMQ
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();

    // Ensure the queue exists
    console.log("Agent is waiting for messages...");

    const phasesPath = path.join(basePath, "phases");
    const phases = new FilePhases(phasesPath);

    while (!phases.isDone()) {
      phases.nextPhase();
      const task = await phases.nextTask();
      // from config.yaml in task folder
      const config = await task.getConfig();
      const { subscribe } = config.channels || {};
      for (var sub of subscribe) {
        const consume = createConsumer({channel, dbs, task, config})
        await channel.assertQueue(sub);
        // create subscription
        channel.consume(sub, consume)
      }
    }

    channel.consume('status', async (message: any) => {
      if (message == 'DONE') {
        // Close the RabbitMQ connection
        await channel.close();
        await connection.close();
      }
    })
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

// Start processing project descriptions
processPhases();
