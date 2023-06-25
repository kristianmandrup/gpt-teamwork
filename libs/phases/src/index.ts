export interface IPhases {
    loadPhases(): Promise<void>
    nextPhase(): Promise<void>
}

export class Phases {
    private phases: Phase[] = [];

    constructor() {
    }

    async loadPhases() {
    }

    async nextPhase() {

    }
}

export interface IPhase {
    loadPhaseTasks(): Promise<void>
    nextPhaseTask(): Promise<void>
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

export interface IPhaseTasks {
    loadTasks(): Promise<void>
    nextTask(): Promise<void>
}

export class PhaseTasks {
    private tasks: PhaseTask[] = [];

    async loadTasks() {
    }

    async nextTask() {
        
    }
}

export interface IPhaseTask {
    loadPrompts(): Promise<void>
    nextPrompt(): Promise<void>
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
