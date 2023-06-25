export interface IPhases {
    loadPhases(): Promise<void>
    nextPhase(): Promise<void>
}

export interface IPhase {
    loadPhaseTasks(): Promise<void>
    nextPhaseTask(): Promise<void>
}

export interface IPhaseTasks {
    loadTasks(): Promise<void>
    nextTask(): Promise<void>
}


export interface IPhaseTask {
    loadPrompts(): Promise<void>
    nextPrompt(): Promise<void>
}

