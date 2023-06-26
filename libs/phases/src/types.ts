export interface IPhases {
    isDone(): boolean
    setDone(): void
    loadPhases(): Promise<void>
    nextPhase(): Promise<IPhase | undefined>
    nextTask(): Promise<IPhaseTask | undefined> 
}

export interface IPhase {
    name: string
    isDone(): boolean
    setDone(): void
    loadGoal(): Promise<void>
    nextTask(): Promise<IPhaseTask | undefined>
}

export interface IPhaseTasks {
    loadTasks(): Promise<void>
    nextTask(): Promise<IPhaseTask | undefined>
}


export interface IPhaseTask {
    name: string
    getPhase(): IPhase
    loadMessages(): Promise<void>
    nextMessage(): Promise<string | undefined>
    getConfig(): Promise<any>;
}

