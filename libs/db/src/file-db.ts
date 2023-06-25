import fs from 'fs';
import path from 'path';
import { DB } from './dbs'

export class FileDB implements DB {
  private path: string;

  constructor(path: string) {
    this.path = path;
    console.log('mkdirsync', path);
    fs.mkdirSync(this.path, { recursive: true });
  }

  clear(key: string) {
    const dbFilePath = path.join(this.path, key);
    console.log('clear', {dbFilePath}, key)
    const filePaths: string[] = fs.readdirSync(dbFilePath, 'utf8');
    for (var filePath of filePaths) {
      fs.unlinkSync(filePath)
    }
  }

  getItem(key: string): string {
    const filePath = path.join(this.path, key);
    console.log('get', {filePath}, key)
    return fs.readFileSync(filePath, 'utf8');
  }

  setItem(key: string, val: string): void {
    const filePath = path.join(this.path, key);
    console.log('set', {filePath}, key, val)    
    fs.writeFileSync(filePath, val);
  }
}
