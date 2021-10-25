import { ITask, TaskStore } from '../../../use-cases/utils/scheduler'
import { MongoStore } from './mongo-store'

export class MongoTaskStore extends MongoStore<ITask> implements TaskStore {
    getAwaitingTasks = async (time: number) => {
        const cursor = this._collection
            .find({
                done: false,
                time: { $lt: time },
            })
            .map(this._instantiate)
        const res = await cursor.toArray()
        await cursor.close()
        return res
    }
}
