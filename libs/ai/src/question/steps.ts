import { IAIToolkit } from '../ai/types';
import { toFiles } from '../response-parser';
import { DBs } from '@gpt-team/db'
import { IPhaseTask } from '@gpt-team/phases'
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

async function run(ai: IAIToolkit, dbs: DBs) {
  const messages = await ai.start(setupSysPrompt(dbs), dbs.input.getItem('main_prompt'));
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) return [];
  await toFiles(dbs.workspace, lastMessage.content);
  return messages;
}

const getLastResponseMessage = (response: ChatCompletionRequestMessage[]) => {
  const lastMessage = response[response.length - 1] || {};
  return lastMessage.content;  
}

const command = (content: string | undefined) => content ? content.trim().toLowerCase() : ''

enum Control {
  ABORT
} 

const createUserMessage = async (content: string): Promise<ChatCompletionRequestMessage | Control> => {
  let user = await question('(answer in text, or "q" to move on)\n');
  // console.log(`User input: ${user}`);  
  if (!user || user === 'q') {
    return Control.ABORT
  }
  user += '\n\n' + 'Is anything else unclear? If yes, only answer in the form:\n' + '{remaining unclear areas} remaining questions.\n' + '{Next question}\n' + 'If everything is sufficiently clear, only answer "no".';
  return { role: 'user', content: user }
}

export type RunPhaseStep = (opts: PhaseStepOpts) => Promise<ChatCompletionRequestMessage[] | undefined>

export async function runPhaseStep({ai, dbs, task, inputs, output, config}: PhaseStepOpts): Promise<ChatCompletionRequestMessage[] | undefined> {
  console.log('run phase step')
  // TODO: use inputs and config
  await task.loadMessages();
  const message = await task.nextMessage();
  if (!message) return
  const chatMsg = ai.fsystem(message);
  const messages = [chatMsg];  
  let user: any = dbs.input.getItem('ui_user');

  // TODO: ...
  while (true) {
    // use output name and type
    const response = await ai.next({messages, prompt: user, output});
    const content = getLastResponseMessage(response)
    const possibleCommand = command(content);
    if (!content || possibleCommand === 'no') {
      break;
    }  
    // { role: 'user', content: user }
    const userMessage = await createUserMessage(content)
    if (userMessage == Control.ABORT) break;
    messages.push(userMessage);
  }
  return messages;
}
