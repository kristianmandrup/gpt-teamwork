import type { OutputOpts } from '@gpt-team/ai'
export {queueNames } from './config'

export interface MsgPayload {
    messages: string[], 
    meta?: Record<string, any>
}

export type SendOpts = {
    output?: OutputOpts
}

export const createSend = (channel: any, queueName: string, sender: string, opts?: SendOpts) => async ({messages, meta}: MsgPayload ) => {
    await channel.assertQueue(queueName);
    opts = opts || {}
    meta ={
        output: opts.output,
        ... meta || {},        
    }
    const body = JSON.stringify({
        sender,
        messages: messages || [],
        meta        
    })
    channel.sendToQueue(queueName, Buffer.from(body));

}
