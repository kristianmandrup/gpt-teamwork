export interface IPhases {
    loadPhases(): Promise<void>
    nextPhase(): Promise<IPhase | undefined>
    nextTask(): Promise<IPhaseTask | undefined> 
}

export interface IPhase {
    loadGoal(): Promise<void>
    nextTask(): Promise<IPhaseTask | undefined>
}

export interface IPhaseTasks {
    loadTasks(): Promise<void>
    nextTask(): Promise<IPhaseTask | undefined>
}


export interface IPhaseTask {
    loadPrompts(): Promise<void>
    nextPrompt(): Promise<string>
}

