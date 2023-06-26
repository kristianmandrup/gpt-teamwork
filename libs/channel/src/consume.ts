import { AI, runPhaseStep } from "@gpt-team/ai";
import type { OutputOpts } from "@gpt-team/ai";
import { createSend } from "./send";
import { parseMsg } from "./parse";
import { queueNames } from "./config";
import { ConsumeMessage } from "amqplib";

export type ConsumerOpts = {
    ai?: any
    channel: any
    dbs: any
    task: any
    config?: any
}

export const createConsumer = ({ai, channel, dbs, task, config }: ConsumerOpts) => async (cmsg: ConsumeMessage) => {
    // OpenAI options
    const model = process.env.GPT_MODEL;
    const temperature = process.env.TEMPERATURE;
    config = config || {}

    ai = ai || new AI({
        model,
        temperature,
      });
      
    // TODO: use task config
    const { publish } = config.channels || {};
    const { input } = config;
    const output: OutputOpts = config.output

    const body = await parseMsg(cmsg)
    const inputMsg = body.message;

    const inputs = [
      inputMsg,
        ...input
    ]

    // TODO: send msgContent as initial input?
    const messages = await runPhaseStep({ai, dbs, inputs, output, task});
    const text = JSON.stringify(messages);

    // dbs.logs.setItem(step.name, text);
    const msgList = messages.map((m: any) => m.content.toString());
    console.log("UI output generated:", msgList);

    // create method to send UI output to UI channel
    const sendMsgs = [] 
    // TODO: make dynamic based on config.channels?
    for (var pub of publish) {
      const sendUiMsg = createSend(channel, pub, "ui");
      sendMsgs.push(sendUiMsg)
    }
    
    const sendDeliverable = createSend(
      channel,
      queueNames.deliverables,
      "ui"
    );

    if (text.match(/-DELIVERABLE-/)) {
      // for fs writer agent to process
      await sendDeliverable({ messages: msgList, meta: { output } });
    }
    
    for (var sendUiMsg of sendMsgs) {
      await sendUiMsg({ messages: msgList });
    }
    // send output returned from step to UI channel
    
  // Acknowledge the message to remove it from the queue
  channel.ack(body);
}
