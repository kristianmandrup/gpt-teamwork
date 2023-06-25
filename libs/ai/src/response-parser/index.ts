import { DB } from '@gpt-team/db'

export type FileInfo = {
  path: string
  content: string
}

export function parseChat(chat: string): FileInfo[] {
  const regex = /```(.*?)```/gs;
  const matches = chat.matchAll(regex);

  const files: FileInfo[] = [];
  for (const match of matches) {
    const path = match[1].split('\n')[0];
    const content = match[1].split('\n').slice(1).join('\n');
    files.push({path, content });
  }

  return files;
}
  
export function filesToFileSystem(workspace: DB, files: FileInfo[], opts: any = {}): void {
  // TODO: if output in opts is set use it to determine what the file is and where it should be put
  for (const {path, content } of files) {
    workspace.setItem(path, content);
  }
}

export function toFiles(workspace: DB, chat?: string): void {
  if (!chat) return;
  workspace.setItem('all_output.txt', chat);

  const files = parseChat(chat);
  for (const {path, content } of files) {
    workspace.setItem(path, content);
  }
}