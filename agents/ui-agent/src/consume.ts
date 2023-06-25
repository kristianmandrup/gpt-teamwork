import { AI, runPhaseStep } from "@gpt-team/ai";
import { queueNames, createSend } from "@gpt-team/channel";
import { ConsumeMessage } from "amqplib";

export type ConsumerOpts = {
    ai?: any
    channel: any
    dbs: any
    task: any
    config?: any
}

export const createConsumer = ({ai, channel, dbs, task, config }: ConsumerOpts) => async (message: ConsumeMessage) => {
    // OpenAI options
    const model = process.env.GPT_MODEL;
    const temperature = process.env.TEMPERATURE;
    config = config || {}

    ai = ai || new AI({
        model,
        temperature,
      });
      
    // TODO: use task config
    // const { publish } = config.channels || {};
    const { input, output } = config;

    const inputs = [
        message.content,
        ...input
    ]

    // TODO: send msgContent as initial input?
    const messages = await runPhaseStep({ai, dbs, inputs, task});
    const text = JSON.stringify(messages);

    // dbs.logs.setItem(step.name, text);
    const msgList = messages.map((m: any) => m.content);
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
  // Acknowledge the message to remove it from the queue
  channel.ack(message);
}
