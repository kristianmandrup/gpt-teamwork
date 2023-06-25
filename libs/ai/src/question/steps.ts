import { AI}  from '../ai';
import { toFiles } from '../response-parser';
import { DBs } from '@gpt-team/db'

const readline = require('readline');

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

async function clarify(ai: AI, dbs: DBs) {
  console.log('clarify')
  const qa = dbs.identity.getItem('qa')
  console.log({qa})
  const qaMsgs = ai.fsystem(qa);
  console.log({qaMsgs})
  const messages = [qaMsgs];
  console.log({messages})
  let user: any = dbs.input.getItem('main_prompt');
  console.log({user})
  while (true) {
    const response = await ai.next(messages, user);
    console.log({response})
    const lastMessage = response[response.length - 1] || {};
    const content = lastMessage.content;
    const possibleCommand = content ? content.trim().toLowerCase() : ''
    if (!content || possibleCommand === 'no') {
      break;
    }
    console.log('clarify');
    
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
  console.log();
  return messages;
}

async function runClarified(ai: AI, dbs: DBs) {
  console.log('runClarified')
  const messages = JSON.parse(dbs.logs.getItem(clarify.name));
  console.log({messages})
  messages[0] = ai.fsystem(setupSysPrompt(dbs));
  const response = await ai.next(messages, dbs.identity.getItem('use_qa'));
  const lastResponse = response[response.length - 1] || {};
  if (!lastResponse) return response
  await toFiles(dbs.workspace, lastResponse.content);
  return response;
}

export const STEPS = {clarify, runClarified};

// Future steps that can be added:
// improveFiles,
// addTests
// runTestsAndFixFiles,
// improveBasedOnInFileFeedbackComments