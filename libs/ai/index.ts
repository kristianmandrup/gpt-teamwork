import { Configuration, OpenAIApi, CreateChatCompletionRequest, ChatCompletionRequestMessage, CreateChatCompletionResponse } from "openai";
import 'dotenv/config'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AI {
  private client: any;
  private kwargs: Record<string, any>;

  constructor(kwargs: Record<string, any>) {
    console.log('configure OpenAIAPI with', configuration)
    this.client = new OpenAIApi(configuration);
    this.kwargs = kwargs;
  }

  public start(system: string, user: string): Promise<ChatCompletionRequestMessage[]> {
    const messages: ChatCompletionRequestMessage[] = [
      { role: "system", content: system },
      { role: "user", content: user },
    ];

    return this.next(messages);
  }

  public fsystem(msg: string): ChatCompletionRequestMessage {
    return { role: "system", content: msg };
  }

  public fuser(msg: string): ChatCompletionRequestMessage {
    return { role: "user", content: msg };
  }

  public async next(messages: ChatCompletionRequestMessage[], prompt?: string): Promise<ChatCompletionRequestMessage[]> {
    if (prompt) {
      messages = messages.concat([{ role: "user", content: prompt }]);
    }
    console.log('next', {messages, prompt})
    console.log('call OpenAIAPI');
    let response
    try {
      const chatRequest: CreateChatCompletionRequest = {
        messages: messages,
        model: this.kwargs.model || "gpt-3.5-turbo",
        ...this.kwargs,
      }
      console.log('calling createChatCompletion with:', chatRequest);
      response = await this.client.createChatCompletion(chatRequest);  
    } catch (ex) {
      console.error(ex);
      throw ex;
    }
    let data: CreateChatCompletionResponse = response.data;

    console.log('parsing responses', data.choices)
    const chat: string[] = [];
    for (const chunk of data.choices) {
      console.log({ chunk })      
      const delta = chunk?.message?.content ?? "";
      console.log(delta);
      chat.push(delta);
    }

    return messages.concat([{ role: "assistant", content: chat.join("") }]);
  }
}
