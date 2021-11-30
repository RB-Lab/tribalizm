import { EntityNotFound } from './not-found-error'
import { Storable, Store } from '../entities/store'
import { QuestType } from '../entities/quest'

export interface TaskStore extends Store<ITask> {
    // TODO: add pagination
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
        await this.taskStore.save(task)
    }
    getTasks = async () => {
        return await this.taskStore.getAwaitingTasks(Date.now())
    }
    markDone = async (taskId: string) => {
        const task = await this.getTask(taskId)
        task.done = true
        await this.taskStore.save(task)
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
    type: 'notify-brainstorm'
    payload: {
        brainstormId: string
    }
}
export function isStormNotify(task: ITask): task is StormNotify {
    return (
        task.type === 'notify-brainstorm' &&
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
export interface StormFinalize extends ITask {
    time: number
    done: boolean
    type: 'brainstorm-to-finalize'
    payload: {
        brainstormId: string
    }
}
export function isStormFinalize(task: ITask): task is StormFinalize {
    return (
        task.type === 'brainstorm-to-finalize' &&
        task.payload !== null &&
        'brainstormId' in task.payload
    )
}

export interface IntroductionTask extends ITask {
    time: number
    done: boolean
    type: 'introduction-quest'
    payload: {
        newMemberId: string
        oldMemberId: string
    }
}
export function isIntroductionTask(task: ITask): task is IntroductionTask {
    return (
        task.type === 'introduction-quest' &&
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
        questType: QuestType
    }
}

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
