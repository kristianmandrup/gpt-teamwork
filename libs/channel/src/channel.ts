import * as amqp from 'amqplib';

export const getChannel = async (rabbitmqUrl) => {
    const connection = await amqp.connect(rabbitmqUrl);
    return await connection.createChannel();    
}

export type OnMessage = (msg: amqp.ConsumeMessage | null) => void

export class MessageBus {
    private url: string;
    private connection: amqp.Connection

    constructor(url: string) {
        this.url = url;        
    }

    async connect() {
        this.connection = await amqp.connect(this.url);
    }

    getChannel = async () => {
        return await this.connection.createChannel();    
    }    
}

export class Channel {
    channel: amqp.Channel

    constructor(channel: amqp.Channel) {        
        this.channel = channel;
    }

    async assertExists(name: string) {
        await this.channel.assertQueue(name);
    }   
    
    async consume(name: string, onMessage: OnMessage, options?: amqp.Options.Consume) {
        return await this.channel.consume(name, onMessage, options)
    }
}