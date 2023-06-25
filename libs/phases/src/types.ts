export interface IPhases {
    loadPhases(): Promise<void>
    nextPhase(): IPhase | undefined
    nextTask(): IPhaseTask | undefined; 
}

export interface IPhase {
    loadGoal(): Promise<void>
    nextTask(): IPhaseTask | undefined; 
}

export interface IPhaseTasks {
    loadTasks(): Promise<void>
    nextTask(): IPhaseTask | undefined
}


export interface IPhaseTask {
    loadPrompts(): Promise<void>
    nextPrompt(): string
}

