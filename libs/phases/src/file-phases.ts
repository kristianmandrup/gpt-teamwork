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
        // load in order
        const sortedFolders = this.sortedFoldersFrom(this.phasesPath)
        for (const folderPath of sortedFolders) {
            const phase = new FilePhase(folderPath)
            this.phases.push(phase)
        }        
    }

    nextPhase(): IPhase | undefined {
        this.currentPhase = this.phases.shift();
        return this.currentPhase;
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
        
        const doc = fs.readFileSync(this.goalPath, 'utf-8');
        this.goal = doc;
    }
}

export class PhaseTasks extends FilePhaseHandler implements IPhaseTasks {
    private filePath: string
    private tasks: IPhaseTask[] = [];
    private currentTask?: IPhaseTask;

    constructor(filePath: string) {
        super()
        this.filePath = filePath;
    }

    async loadTasks() {
        // TODO: load order
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

    nextTask(): IPhaseTask | undefined {
        this.currentTask = this.tasks.shift();
        return this.currentTask;        
    }
}

export class FilePhaseTask implements IPhaseTask {
    private filePath: string
    private file: string = '';
    // private prompts: string[] = [];

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    async loadPrompts() {
        this.file = fs.readFileSync(this.filePath, 'utf8')
    }

    nextPrompt(): string {
        return this.file;
    }
}
