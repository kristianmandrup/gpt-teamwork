export interface IPhases {
    loadPhases(): Promise<void>
    nextPhase(): IPhase | undefined
}

export interface IPhase {
    loadGoal(): Promise<void>
}

export interface IPhaseTasks {
    loadTasks(): Promise<void>
    nextTask(): IPhaseTask | undefined
}


export interface IPhaseTask {
    loadPrompts(): Promise<void>
    nextPrompt(): string
}

