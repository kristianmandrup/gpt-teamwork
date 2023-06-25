export interface DB {  
    getItem(key: string): string;
    setItem(key: string, val: string): void;
    clear(key: string): void
}

export interface DBs {
    memory: DB;
    logs: DB;
    identity: DB;
    input: DB;
    workspace: DB;
    clear?: (key: string) => void
}