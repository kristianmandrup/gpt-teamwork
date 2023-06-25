import type { IPhase } from './types'
import path from 'path'
import fs from 'fs'

export class FilePhases {
    private phases: IPhase[] = [];
    private basePath: string

    constructor(basePath: string) {
        this.basePath = basePath
    }

    async loadPhases() {
        const phasesPath = path.join(this.basePath, 'phases');
        fs.readdirSync(phasesPath);
        // TODO
    }

    async nextPhase() {

    }
}

export class Phase {
    private phaseTasks: PhaseTasks;

    constructor() {
        this.phaseTasks = new PhaseTasks();
    }

    async loadPhaseTasks() {
    }

    async nextPhaseTask() {
    }
}

export class PhaseTasks {
    private tasks: PhaseTask[] = [];

    async loadTasks() {
    }

    async nextTask() {
        
    }
}

export class PhaseTask {
    private prompts: string[] = [];

    constructor() {
    }

    async loadPrompts() {
    }

    async nextPrompt() {
        
    }
}
