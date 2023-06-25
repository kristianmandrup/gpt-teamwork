import { AI}  from '../ai';
import { toFiles } from '../response-parser';
import { DBs } from '@gpt-team/db'
import { IPhaseTask } from '@gpt-team/phases'

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

async function run(ai: AI, dbs: DBs) {
  const messages = await ai.start(setupSysPrompt(dbs), dbs.input.getItem('main_prompt'));
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) return [];
  await toFiles(dbs.workspace, lastMessage.content);
  return messages;
}

export type OutputOpts = {
  name: string
  type: string
  language?: string
  ext?: string
}

export type PhaseStepOpts = {
  ai: AI
  dbs: DBs
  task: IPhaseTask
  output?: OutputOpts
  inputs?: string[]
  config?: any
}

export async function runPhaseStep({ai, dbs, task, inputs, output, config}: PhaseStepOpts) {
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
    const lastMessage = response[response.length - 1] || {};
    const content = lastMessage.content;
    // TODO: refactor/extract and make generic/configurable
    const possibleCommand = content ? content.trim().toLowerCase() : ''
    if (!content || possibleCommand === 'no') {
      break;
    }
    user = await question('(answer in text, or "q" to move on)\n');
    console.log(`User input: ${user}`);  
    //user = prompt('(answer in text, or "q" to move on)\n');
    //console.log();
    if (!user || user === 'q') {
      break;
    }
    user += '\n\n' + 'Is anything else unclear? If yes, only answer in the form:\n' + '{remaining unclear areas} remaining questions.\n' + '{Next question}\n' + 'If everything is sufficiently clear, only answer "no".';
    messages.push({ role: 'user', content: user });
  }
  return messages;
}
