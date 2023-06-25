import { FileDB } from '@gpt-team/db';
import path from 'path';

export const createDbs =(basePath: string = process.cwd()) => {
  return {  
    memory: new FileDB(path.join(basePath, 'memory')),
    logs: new FileDB(path.join(basePath, 'logs')),
    identity: new FileDB(path.join(basePath, 'identity')),
    input: new FileDB(path.join(basePath, 'input')),
    workspace: new FileDB(path.join(basePath, 'workspace')),
  };
}

