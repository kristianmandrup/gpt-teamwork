export interface MsgPayload {
    messages: string[], 
    meta?: Record<string, any>
}

export const createSend = (channel: any, queueName: string, sender: string) => async ({messages, meta}: MsgPayload ) => {
    await channel.assertQueue(queueName);
    const body = JSON.stringify({
        sender,
        messages: messages || [],
        meta: meta || {}
    })
    channel.sendToQueue(queueName, Buffer.from(body));

}
