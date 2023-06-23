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

  getItem(key: string): string {
    const filePath = path.join(this.path, key);
    console.log({filePath}, key)
    return fs.readFileSync(filePath, 'utf8');
  }

  setItem(key: string, val: string): void {
    const filePath = path.join(this.path, key);
    fs.writeFileSync(filePath, val);
  }
}
