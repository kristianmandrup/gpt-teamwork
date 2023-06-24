import * as amqp from 'amqplib';
import { AI, STEPS,  } from '@gpt-team/ai'
import { queueNames, createSend } from '@gpt-team/channel'
import { createDbs } from './dbs';
import path from 'path';

// Function to process project descriptions and generate use cases
async function processProjectDescriptions() {
  // Db
  const basePath = path.join(process.cwd(), 'agents', 'api-agent', 'db');
  const dbs = createDbs(basePath)

  // RabbitMQ connection URL
  const rabbitmqUrl = 'amqp://localhost';
  
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

    console.log('Agent is waiting for project descriptions...');

    // Consume messages from the queue
    channel.consume(queueNames.project, async (message: any) => {
      const projectDescription = JSON.parse(message.content.toString());

      // TODO: Use the project description to generate basic UI using the OpenAI API
      const ai = new AI({
        model,
        temperature,
      });

      // create method to send UI output to UI channel
      const sendApiMsg = createSend(channel, queueNames.api, 'api')
      const sendDeliverable = createSend(channel, queueNames.deliverables, 'api')

      const promises = Object.keys(STEPS).map(async (key) => {
        const step: any = (STEPS as any)[key];
        const messages = await step(ai, dbs);
        const text = JSON.stringify(messages)
        dbs.logs.setItem(step.name, text);
        
        const msgList = messages.map((m: any) => message.content);

        if (text.match(/-DELIVERABLE-/)) {
          // for fs writer agent to process
          await sendDeliverable({messages: msgList})
        }
        
        console.log('API output generated:', msgList);        
        // send output returned from step to UI channel
        await sendApiMsg({messages: msgList});
      });
      await Promise.all(promises);
      // Acknowledge the message to remove it from the queue
      channel.ack(message);
    });

    // Close the RabbitMQ connection
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

// Start processing project descriptions
processProjectDescriptions();