import { Context } from './context'
import { ITask } from '../entities/task'
import { EntityNotFound } from './not-found-error'

export class Scheduler {
    private context: Context
    constructor(context: Context) {
        this.context = context
    }
    schedule = async (task: ITask) => {
        this.context.stores.taskStore.save(task)
    }
    getTasks = async () => {
        return await this.context.stores.taskStore.getAwaitingTasks(Date.now())
    }
    markDone = async (taskId: string) => {
        const task = await this.getTask(taskId)
        task.done = true
        this.context.stores.taskStore.save(task)
    }
    private async getTask(taskId: string) {
        const task = await this.context.stores.taskStore.getById(taskId)
        if (!task) {
            throw new EntityNotFound(`Task ${taskId} not found`)
        }
        return task
    }
}
