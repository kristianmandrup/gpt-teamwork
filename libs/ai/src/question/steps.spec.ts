import { ChatCompletionRequestMessage } from 'openai';
import { describe, test } from 'node:test'
import { Control, promptAi } from './steps'
import assert from 'node:assert';

describe('promptAi', () => {
    // mock ai.next
    const response = {
        code: ``
    }

    let responseType = 'code';

    const aiResponse = async(opts: any) => response[responseType]

    test('aborts on command: no', async () => {
        const sysMsg: ChatCompletionRequestMessage = { role: "system", content: 'hello' }
        const messages = [sysMsg]
        const prompt = "what to do?"
        const result = await promptAi({aiResponse, messages, prompt})
        assert.equal(result, Control.ABORT);
    })    
})