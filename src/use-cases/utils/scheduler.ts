import { EntityNotFound } from './not-found-error'
import { Storable, Store } from '../entities/store'

export interface TaskStore extends Store<ITask> {
    getAwaitingTasks: (time: number) => Promise<Array<ITask & Storable>>
}

export interface ITask {
    time: number
    done: boolean
    type: string
    payload: object | null
}

export class Scheduler {
    private taskStore: TaskStore
    constructor(taskStore: TaskStore) {
        this.taskStore = taskStore
    }
    schedule = async <T extends ITask>(task: T) => {
        this.taskStore.save(task)
    }
    getTasks = async () => {
        return await this.taskStore.getAwaitingTasks(Date.now())
    }
    markDone = async (taskId: string) => {
        const task = await this.getTask(taskId)
        task.done = true
        this.taskStore.save(task)
    }
    private async getTask(taskId: string) {
        const task = await this.taskStore.getById(taskId)
        if (!task) {
            throw new EntityNotFound(`Task ${taskId} not found`)
        }
        return task
    }
}

export interface StormNotify extends ITask {
    time: number
    done: boolean
    type: 'notfy-brainstorm'
    payload: {
        brainstormId: string
    }
}
export function isStormNotify(task: ITask): task is StormNotify {
    return (
        task.type === 'notfy-brainstorm' &&
        task.payload !== null &&
        'brainstormId' in task.payload
    )
}

export interface StormStart extends ITask {
    time: number
    done: boolean
    type: 'start-brainstorm'
    payload: {
        brainstormId: string
    }
}
export function isStormStart(task: ITask): task is StormStart {
    return (
        task.type === 'start-brainstorm' &&
        task.payload !== null &&
        'brainstormId' in task.payload
    )
}
export interface StormToVoting extends ITask {
    time: number
    done: boolean
    type: 'brainstorm-to-voting'
    payload: {
        brainstormId: string
    }
}
export function isStormToVoting(task: ITask): task is StormToVoting {
    return (
        task.type === 'brainstorm-to-voting' &&
        task.payload !== null &&
        'brainstormId' in task.payload
    )
}
export interface StormFinalyze extends ITask {
    time: number
    done: boolean
    type: 'brainstorm-to-finalyze'
    payload: {
        brainstormId: string
    }
}
export function isStormFinalyze(task: ITask): task is StormFinalyze {
    return (
        task.type === 'brainstorm-to-finalyze' &&
        task.payload !== null &&
        'brainstormId' in task.payload
    )
}

export interface IntroductionTask extends ITask {
    time: number
    done: boolean
    type: 'intorduction-quest'
    payload: {
        newMemberId: string
        oldMemberId: string
    }
}
export function isIntroductionTask(task: ITask): task is IntroductionTask {
    return (
        task.type === 'intorduction-quest' &&
        task.payload !== null &&
        'newMemberId' in task.payload &&
        'oldMemberId' in task.payload
    )
}

export interface HowWasQuestTask extends ITask {
    time: number
    done: boolean
    type: 'how-was-quest'
    payload: {
        questId: string
    }
}
// NOTE HowWasQuestTask should be handled differently depentding on quest type:
//      - cast votes for intro and coordination and init for new member
//      - accept or decline application for init for chief/shaman
export function isHowWasQuestTask(task: ITask): task is HowWasQuestTask {
    return (
        task.type === 'how-was-quest' &&
        task.payload !== null &&
        'questId' in task.payload
    )
}

export interface HowWasGatheringTask extends ITask {
    time: number
    done: boolean
    type: 'how-was-gathering'
    payload: {
        gatheringId: string
    }
}
export function isHowWasGatheringTask(
    task: ITask
): task is HowWasGatheringTask {
    return (
        task.type === 'how-was-gathering' &&
        task.payload !== null &&
        'gatheringId' in task.payload
    )
}
