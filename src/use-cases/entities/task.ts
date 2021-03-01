import { Storable, Store } from './store'

export interface TaskStore extends Store<ITask> {
    getAwaitingTasks: (time: number) => Promise<Array<ITask & Storable>>
}

export interface ITask {
    time: number
    done: boolean
    type: string
    payload: object | null
}
