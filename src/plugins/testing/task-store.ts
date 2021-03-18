import { ITask, TaskStore } from '../../use-cases/utils/scheduler'
import { InMemoryStore } from './in-memory-store'

export class InMemoryTaskStore extends InMemoryStore<ITask>
    implements TaskStore {
    getAwaitingTasks = async (time: number) => {
        return Object.values(this._store).filter(
            (task) => task.done === false && task.time <= time
        )
    }
}
