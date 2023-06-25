import * as amqp from "amqplib";
import { AI, runPhaseStep } from "@gpt-team/ai";
import { queueNames, createSend } from "@gpt-team/channel";
import { FilePhases } from "@gpt-team/phases";
import { createDbs } from "./dbs";

import path from "path";

// Function to process project descriptions and generate use cases
async function processMsgs() {
  // Db
  const basePath = path.join(process.cwd(), "agents", "ui-agent", "db");
  const dbs = createDbs(basePath);

  // RabbitMQ connection URL
  const rabbitmqUrl = "amqp://localhost";

  // OpenAI options
  const model = process.env.GPT_MODEL;
  const temperature = process.env.TEMPERATURE;

  // Create an instance of the OpenAI API client
  // Define the queue name
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();

    // Ensure the queue exists
    await channel.assertQueue(queueNames.project);

    console.log("Agent is waiting for project descriptions...");

    const phasesPath = path.join(basePath, "phases");
    const phases = new FilePhases(phasesPath);
    // TODO: start sub-agent (subscriber for each active phase ...)

    // Consume messages from the queue
    channel.consume(queueNames.project, async (message: any) => {
      const msgContent = JSON.parse(message.content.toString());

      // TODO: Use the project description to generate basic UI using the OpenAI API
      const ai = new AI({
        model,
        temperature,
      });

      while (!phases.isDone()) {
        phases.nextPhase();
        const task = await phases.nextTask();
        // from config.yaml in task folder
        const config = task.getConfig();
        const { subscribe, publish } = config.channels || {};
        const { input, output } = config;

        // TODO: send msgContent as initial input?
        const messages = await runPhaseStep(ai, dbs, task);
        const text = JSON.stringify(messages);

        // dbs.logs.setItem(step.name, text);
        const msgList = messages.map((m: any) => message.content);
        console.log("UI output generated:", msgList);

        // create method to send UI output to UI channel
        // TODO: make dynamic based on config.channels?
        const sendUiMsg = createSend(channel, queueNames.ui, "ui");
        const sendDeliverable = createSend(
          channel,
          queueNames.deliverables,
          "ui"
        );

        if (text.match(/-DELIVERABLE-/)) {
          // for fs writer agent to process
          await sendDeliverable({ messages: msgList });
        }
        // send output returned from step to UI channel
        await sendUiMsg({ messages: msgList });
      }
      // Acknowledge the message to remove it from the queue
      channel.ack(message);
    });

    // Close the RabbitMQ connection
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

// Start processing project descriptions
processMsgs();
