import * as amqp from 'amqplib';
import { AI } from '../../libs/ai'
import { STEPS } from '../../libs/question'
import { createDbs } from './dbs';
import path from 'path';

// Function to process project descriptions and generate use cases
async function processProjectDescriptions() {
  
  // RabbitMQ connection URL
  const rabbitmqUrl = 'amqp://localhost';
  
  // OpenAI options
  const model = process.env.GPT_MODEL;
  const temperature = process.env.TEMPERATURE;
  
  // Create an instance of the OpenAI API client  
  // Define the queue name
  const queueName = 'project_queue';  

  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();

    // Ensure the queue exists
    await channel.assertQueue(queueName);

    console.log('Agent is waiting for project descriptions...');

    // Consume messages from the queue
    channel.consume(queueName, async (message: any) => {
      const projectDescription = JSON.parse(message.content.toString());

      // TODO: Use the project description to generate basic UI using the OpenAI API
      const ai = new AI({
        model,
        temperature,
      });
      const basePath = path.join(process.cwd(), 'agents', 'ui-agent', 'db');
      const dbs = createDbs(basePath)

      for (const step of STEPS) {
        const messages = await step(ai, dbs);
        dbs.logs.setItem(step.name, JSON.stringify(messages));
      }

      console.log('Use cases generated:', dbs.logs);

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