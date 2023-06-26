import * as amqp from "amqplib";
import path from "path";
import { ConsumeMessage } from "amqplib";
import { IPhase, FilePhases } from "@gpt-team/phases";
import { MessageBus } from "./channel";
import { createConsumer } from "./consume";
import { runPhaseStep } from "@gpt-team/ai";

export type TeamProps = {
  name: string
}

export type ProcessPhasesOps = {
    basePath: string
    createDbs: any
    mqUrl: string
    team: TeamProps
}
  
export const terminationMsgs = ['COMPLETED', 'TERMINATED']

// Function to process project descriptions and generate use cases
export async function setupAgentMessageBusProcessor({basePath, mqUrl, createDbs, team}: ProcessPhasesOps) {
    const isTeamDone = ({ body }: any) => {
        return terminationMsgs.includes(body.message) && body.sender == team.name
      }

    // Db
    const dbs = createDbs(basePath);
  
    // RabbitMQ connection URL  
    try {
      const msgBus = new MessageBus(mqUrl)
  
      // Connect to RabbitMQ
      const connection = await msgBus.connect()
      const channel = await msgBus.getChannel();
  
      // Ensure the queue exists
      console.log("Agent is waiting for messages...");
  
      const phasesPath = path.join(basePath, "phases");
      const phases = new FilePhases(phasesPath);
      let phase: IPhase
  
      channel.consume('status', async (cmsg: ConsumeMessage) => {
        const body = await channel.parseMsg(cmsg)
  
        if (isTeamDone({body, phase })) {
          phases.setDone()
        }
      })
  
      const chn = channel.getRawChannel()
      phase = await phases.nextPhase();
      const run = runPhaseStep
  
      while (!phases.isDone()) {
        const task = await phases.nextTask();
        if (phase.isDone()) {
          phase = await phases.nextPhase();
        }
        // from config.yaml in task folder
        const config = await task.getConfig();
        const { subscribe } = config.channels || {};
        for (var sub of subscribe) {
          const consume = createConsumer({channel, dbs, phase, task, config, run})
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
  