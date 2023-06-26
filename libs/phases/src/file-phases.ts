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

    // TODO: only folders
    fileFilter(file: string) {
        return this.indexof(file) >= 0
    }
        
    sortedFoldersFrom(filePath: string) {
        const files = fs.readdirSync(filePath);
        const useFolders = files.filter((f) => this.fileFilter(f) );
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

    setDone() {
        this.done = true
    }

    constructor(basePath: string) {
        super();
        this.basePath = basePath
        this.phasesPath = path.join(this.basePath, 'phases');
    }

    async loadOrder() {
        const phasesOrderPath = path.join(this.phasesPath, 'phase-order.yml');
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
    private folderPath: string
    private phaseTasksPath: string
    private goalPath: string
    private goal: string = '';
    private done: boolean = false;

    isDone(): boolean {
        return this.done
    }

    setDone(): void {
        this.done = true
    }

    constructor(folderPath: string) {
        super()
        this.folderPath = folderPath;
        this.goalPath = path.join(this.folderPath, 'goal.md');
        this.phaseTasksPath = path.join(this.folderPath, 'phase-tasks');
        this.phaseTasks = new PhaseTasks(this, this.phaseTasksPath);
    }

    get name(): string {
        return path.parse(this.folderPath).name
    }

    async loadGoal() {        
        if (this.goal) return;
        const doc = fs.readFileSync(this.goalPath, 'utf-8');
        this.goal = doc;
    }

    async nextTask() {        
        if (this.phaseTasks.isDone()) {
            this.done = true;
            return
        }
        return this.phaseTasks.nextTask();
    }
}

export class PhaseTasks extends FilePhaseHandler implements IPhaseTasks {
    private tasksPath: string
    private tasks: IPhaseTask[] = [];
    private currentTask?: IPhaseTask;
    private done: boolean = false;
    private phase: IPhase;

    isDone(): boolean {
        return this.done
    }

    getPhase(): IPhase {
        return this.phase
    }

    constructor(phase: IPhase, tasksPath: string) {
        super()
        this.phase = phase;
        this.tasksPath = tasksPath;
    }

    // TODO: only folders
    fileFilter(file: string) {
        return this.indexof(file) >= 0
    }

    async loadOrder() {
        const tasksOrderPath = path.join(this.tasksPath, 'task-order.yml');
        try {
            const file = fs.readFileSync(tasksOrderPath, 'utf8')
            const doc = yaml.load(file);
            this.ordering = doc
          } catch (e) {
            console.log(e);
          }        
    }

    async loadTasks() {
        if (this.tasks.length > 0) return;
        const files = fs.readdirSync(this.tasksPath);
        const useFolders = files.filter((f) => this.fileFilter(f) );
        const sortedFolders = useFolders.sort((f1: string, f2: string) => {
            return this.indexof(f1) <= this.indexof(f2) ? 1 : 0;
        });
        for (const folderPath of sortedFolders) {
            const task = new FilePhaseTask(this.getPhase(), folderPath)
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
    private phase: IPhase

    isDone(): boolean {
        return this.done
    }

    get name(): string {
        return path.parse(this.folderPath).name
    }

    constructor(phase: IPhase, folderPath: string) {
        super();
        this.phase = phase
        this.folderPath = folderPath;
    }

    async getConfig() {
        await this.loadConfig();
        return this.config;
    }

    getPhase(): IPhase {
        return this.phase
    }

    // TODO: only txt and md files
    fileFilter(file: string) {
        return this.indexof(file) >= 0
    }

    async loadConfig() {
        if (this.config) return
        const configPath = path.join(this.folderPath, 'config.yml');
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
        const useFiles = files.filter((f) => this.fileFilter(f) );
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
