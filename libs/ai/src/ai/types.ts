import { Configuration, OpenAIApi, CreateChatCompletionRequest, ChatCompletionRequestMessage, CreateChatCompletionResponse } from "openai";
import 'dotenv/config'

export type NextOpts = {
    messages: ChatCompletionRequestMessage[]
    prompt?: string
    output?: any
}

export interface IAIToolkit {    
    start(system: string, user: string): Promise<ChatCompletionRequestMessage[]>
  
    fsystem(msg: string): ChatCompletionRequestMessage
  
    fuser(msg: string): ChatCompletionRequestMessage
  
    next({messages, prompt, output}: NextOpts): Promise<ChatCompletionRequestMessage[]>
}