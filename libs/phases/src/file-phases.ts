import type { IPhase, IPhaseTask, IPhaseTasks, IPhases } from './types'
import path from 'path'
import fs from 'fs'
import * as yaml from 'js-yaml';

export class FilePhaseHandler {
    protected ordering: any;

    indexof(folderPath: string): number {
        const fileName = path.parse(folderPath).name
        return this.ordering.indexof(fileName)
    }
        
    sortedFoldersFrom(filePath: string) {
        const folders = fs.readdirSync(filePath);
        const useFolders = folders.filter((f) => this.indexof(f) >= 0 );
        return useFolders.sort((f1: string, f2: string) => {
            return this.indexof(f1) <= this.indexof(f2) ? 1 : 0;
        });    
    }
}

export class FilePhases extends FilePhaseHandler implements IPhases {
    private phases: IPhase[] = [];
    private currentPhase?: IPhase;
    private basePath: string
    private phasesPath: string
    private done: boolean = false;

    isDone(): boolean {
        return this.done
    }

    constructor(basePath: string) {
        super();
        this.basePath = basePath
        this.phasesPath = path.join(this.basePath, 'phases');
    }

    async loadOrder() {
        const phasesOrderPath = path.join(this.phasesPath, 'phase-order.yaml');
        try {
            const file = fs.readFileSync(phasesOrderPath, 'utf8')
            const doc = yaml.load(file);
            this.ordering = doc
          } catch (e) {
            console.log(e);
          }        
    }

    async loadPhases() {                
        if (this.phases.length > 0) return;
        const sortedFolders = this.sortedFoldersFrom(this.phasesPath)
        for (const folderPath of sortedFolders) {
            const phase = new FilePhase(folderPath)
            this.phases.push(phase)
        }        
    }

    async nextPhase() {
        await this.loadPhases();
        this.currentPhase = this.phases.shift();
        if (!this.currentPhase) {
            this.done = true;
        }
        return this.currentPhase;
    }

    async nextTask() {
        if (this.isDone()) return
        if (!this.currentPhase) {
            this.nextPhase();
        }
        return this.currentPhase?.nextTask();
    }
}

export class FilePhase extends FilePhaseHandler implements IPhase {
    private phaseTasks: PhaseTasks;
    private filePath: string
    private phaseTasksPath: string
    private goalPath: string
    private goal: string = '';

    constructor(filePath: string) {
        super()
        this.filePath = filePath;
        this.goalPath = path.join(this.filePath, 'goal.md');
        this.phaseTasksPath = path.join(this.filePath, 'phase-tasks');
        this.phaseTasks = new PhaseTasks(this.phaseTasksPath);
    }

    async loadGoal() {        
        if (this.goal) return;
        const doc = fs.readFileSync(this.goalPath, 'utf-8');
        this.goal = doc;
    }

    nextTask() {
        return this.phaseTasks.nextTask();
    }
}

export class PhaseTasks extends FilePhaseHandler implements IPhaseTasks {
    private filePath: string
    private tasks: IPhaseTask[] = [];
    private currentTask?: IPhaseTask;
    private done: boolean = false;

    isDone(): boolean {
        return this.done
    }

    constructor(filePath: string) {
        super()
        this.filePath = filePath;
    }

    async loadTasks() {
        if (this.tasks.length > 0) return;
        const folders = fs.readdirSync(this.filePath);
        const useFolders = folders.filter((f) => this.indexof(f) >= 0 );
        const sortedFolders = useFolders.sort((f1: string, f2: string) => {
            return this.indexof(f1) <= this.indexof(f2) ? 1 : 0;
        });
        for (const folderPath of sortedFolders) {
            const task = new FilePhaseTask(folderPath)
            this.tasks.push(task)
        }        
    }

    async nextTask() {
        if (this.isDone()) return
        if (!this.tasks || this.tasks.length == 0) {
            this.loadTasks();
        }
        this.currentTask = this.tasks.shift();
        if (!this.currentTask) {
            this.done = true;
        }
        return this.currentTask;        
    }
}

// such as use-cases
export class FilePhaseTask extends FilePhaseHandler implements IPhaseTask {
    private folderPath: string
    private messages: string[] = [];
    private config: any;
    private done: boolean = false;

    isDone(): boolean {
        return this.done
    }

    constructor(folderPath: string) {
        super();
        this.folderPath = folderPath;
    }

    getConfig() {
        return this.config;
    }

    async loadConfig() {
        const configPath = path.join(this.folderPath, 'config.yaml');
        try {
            const file = fs.readFileSync(configPath, 'utf8')
            const doc = yaml.load(file);
            this.config = doc
          } catch (e) {
            console.log(e);
          }        
    }

    async loadMsgFile(filePath: string) {
        const fullFilePath = path.join(this.folderPath, filePath);
        try {
            return fs.readFileSync(fullFilePath, 'utf8');
        } catch (e) {
            console.log(e);
        }        
    }

    async loadMessages() {
        if (this.messages.length > 0) return;
        const files = fs.readdirSync(this.folderPath);
        const useFiles = files.filter((f) => this.indexof(f) >= 0 );
        const sortedFiles = useFiles.sort((f1: string, f2: string) => {
            return this.indexof(f1) <= this.indexof(f2) ? 1 : 0;
        });
        for (const filePath of sortedFiles) {
            const message = await this.loadMsgFile(filePath)
            if (!message) continue;
            this.messages.push(message)
        }        
    }

    async nextMessage() {
        await this.loadMessages();
        const msg = this.messages.shift();
        if (!msg) {
            this.done = true;
        }
        return msg;
    }
}
