import { IAIToolkit } from '../ai/types';
import { toFiles } from '../response-parser';
import { DBs } from '@gpt-team/db'
import { PhaseStepOpts } from './types';
import { ChatCompletionRequestMessage } from 'openai';

const readline = require('readline');

// TODO: use prompt-sync library?
function question(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer: string) => {
      resolve(answer);
      rl.close();
    });
  });
}


function setupSysPrompt(dbs: DBs): string {
  return dbs.identity.getItem('setup') + '\nUseful to know:\n' + dbs.identity.getItem('philosophy');
}

const getLastResponseMessage = (messages: ChatCompletionRequestMessage[]): string | undefined => { 
  return messages[messages.length - 1]?.content
};

export async function run(ai: IAIToolkit, dbs: DBs) {
  const messages = await ai.start(setupSysPrompt(dbs), dbs.input.getItem('main_prompt'));
  const lastMessage = getLastResponseMessage(messages);
  if (!lastMessage) return [];
  await toFiles(dbs.workspace, lastMessage);
  return messages;
}

const command = (content: string | undefined) => content ? content.trim().toLowerCase() : ''

export enum Control {
  ABORT
} 

export const createUserMessage = async (content: string): Promise<ChatCompletionRequestMessage | Control> => {
  let user = await question('(answer in text, or "q" to move on)\n');
  // console.log(`User input: ${user}`);  
  if (!user || user === 'q') {
    return Control.ABORT
  }
  user += '\n\n' + 'Is anything else unclear? If yes, only answer in the form:\n' + '{remaining unclear areas} remaining questions.\n' + '{Next question}\n' + 'If everything is sufficiently clear, only answer "no".';
  return { role: 'user', content: user }
}

export type RunPhaseStep = (opts: PhaseStepOpts) => Promise<ChatCompletionRequestMessage[] | undefined>

export const createGetUserMsg = (dbs: DBs) => () => dbs.input.getItem('ui_user')

export const createAiResponse = (opts: any) => async ({messages, prompt}: any) => {
  const { ai, output } = opts
  if (!ai) {
    throw 'aiResponse: Missing ai instance'
  }
  const response: ChatCompletionRequestMessage[] = await opts.ai.next({messages, prompt, output});
  return getLastResponseMessage(response)
} 

export type PromptAiOpts = {
  aiResponse?: (opts: any) => Promise<string | undefined>
  messages: ChatCompletionRequestMessage[]
  prompt: string
  opts?: any
}

export const promptAi = async ({aiResponse, messages, prompt, opts}: PromptAiOpts) => {
    aiResponse = aiResponse || createAiResponse(opts)
    if (!aiResponse) {
      throw 'promptAi: missing aiResponse'
    }       
    const content = await aiResponse({messages, prompt})
    // use output name and type
    const possibleCommand = command(content);
    if (!content || possibleCommand === 'no') {
      return Control.ABORT;
    }  
    // { role: 'user', content: user }
    const userMessage = await createUserMessage(content)
    if (userMessage == Control.ABORT) return Control.ABORT;
    messages.push(userMessage);
}

export async function runPhaseStep({ai, dbs, task, inputs, getUserMsg, output, config}: PhaseStepOpts): Promise<ChatCompletionRequestMessage[] | undefined> {
  console.log('run phase step')
  // TODO: use inputs and config
  await task.loadMessages();
  const message = await task.nextMessage();
  if (!message) return

  const chatMsg = ai.fsystem(message);
  const messages = [chatMsg];  
  getUserMsg = getUserMsg || createGetUserMsg(dbs)
  
  let prompt: any = getUserMsg();

  // TODO: ...
  while (true) {
    const opts = {ai, output}
    const result = await promptAi({messages, prompt, opts})
    if (result == Control.ABORT) break;
  }
  return messages;
}
