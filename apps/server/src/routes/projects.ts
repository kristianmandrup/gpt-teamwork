import express from 'express';
import bodyParser from  'body-parser'
import * as amqp from  'amqplib'

const app = express();
app.use(bodyParser.json());

// RabbitMQ connection URL
const rabbitmqUrl = 'amqp://localhost';

// Endpoint to receive project description
app.post('/projects', async (req: any, res: any) => {
  const projectDescription = req.body;

  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();

    // Define the queue name
    const queueName = 'project_queue';

    // Send the project description to the queue
    await channel.assertQueue(queueName);
    const body = {
      message: projectDescription      
    }
    const msg = JSON.stringify(body)

    channel.sendToQueue(queueName, Buffer.from(msg));

    // Close the RabbitMQ connection
    await channel.close();
    await connection.close();

    res.status(200).json({ message: 'Project description received and stored successfully' });
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ message: 'An error occurred while storing the project description' });
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});