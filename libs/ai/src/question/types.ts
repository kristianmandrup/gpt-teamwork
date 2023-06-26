import { IPhaseTask } from "@gpt-team/phases"
import { IAIToolkit } from "../ai"
import { DBs } from "@gpt-team/db"

export type OutputOpts = {
    name: string
    type: string
    language?: string
    ext?: string
  }
  
  export type PhaseStepOpts = {
    ai: IAIToolkit
    dbs: DBs
    task: IPhaseTask
    output?: OutputOpts
    inputs?: string[]
    config?: any
  }