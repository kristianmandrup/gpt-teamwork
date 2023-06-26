import path from 'path'
import fs from 'fs'
import * as yaml from 'js-yaml';
import { IPhase, IPhaseTask, IPhaseTasks, IPhases } from "./types";

export const loadYamlFile = async (filePath: string) => {
    try {
        const file = fs.readFileSync(filePath, 'utf8')
        return yaml.load(file);
      } catch (e) {
        console.log(e);
      }        
}


export class YamlPhases implements IPhases {
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
        this.basePath = basePath
        this.phasesPath = path.join(this.basePath, 'phases.yaml');
    }

    async loadPhases() {                
         const config: any = await loadYamlFile(this.phasesPath)
         for (var phaseConfig in config.phases as any[]) {
            const phase = new YamlPhase(phaseConfig)
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

export class YamlPhase implements IPhase {
    private goal: string = '';
    private done: boolean = false;
    private config: any
    private tasks: IPhaseTask[] = []

    isDone(): boolean {
        return this.done
    }

    setDone(): void {
        this.done = true
    }

    constructor(config: any) {
        this.config = config
    }

    get name(): string {
        return this.config.name
    }

    getGoal(): string {
        return this.goal
    }

    async loadGoal() {        
        this.goal = this.config.goal;
    }

    async loadTasks() {            
        for (var taskConfig of this.config.tasks) {
            const task = new YamlPhaseTask(this, taskConfig)
            this.tasks.push(task)
        }
    }

    async nextTask() {
        await this.loadTasks();
        const task = this.tasks.shift();
        if (!task) {
            this.done = true;
        }
        return task;
    }
}

export class YamlPhaseTask implements IPhaseTask {
    private taskConfig: any
    private messages: string[] = [];
    private config: any;
    private done: boolean = false;
    private phase: IPhase

    isDone(): boolean {
        return this.done
    }

    get name(): string {
        return this.taskConfig.name
    }

    getConfig() {
        return this.taskConfig.config
    }

    constructor(phase: IPhase, taskConfig: any) {
        this.phase = phase
        this.taskConfig = taskConfig
    }

    getPhase(): IPhase {
        return this.phase
    }

    async loadMessages() {
        this.messages = this.taskConfig.messages
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
