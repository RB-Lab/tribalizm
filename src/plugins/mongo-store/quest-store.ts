import {
    IQuest,
    QuestStatus,
    QuestStore,
    QuestType,
} from '../../use-cases/entities/quest'
import { MongoStore } from './mongo-store'

export class MongoQuestStore extends MongoStore<IQuest> implements QuestStore {
    getActiveQuestsCount = async (memberIds: string[]) => {
        const cursor = this._collection.find({
            memberIds: { $elemMatch: { $in: memberIds } },
            status: { $in: [QuestStatus.accepted, QuestStatus.proposed] },
        })
        const res: Record<string, number> = {}
        await cursor.forEach((quest: IQuest) => {
            memberIds.forEach((mid) => {
                const questCount = quest.memberIds.includes(mid) ? 1 : 0
                res[mid] = (res[mid] || 0) + questCount
            })
        })
        await cursor.close()
        return res
    }
    getAllIntorQuests = async (memberId: string) => {
        const cursor = this._collection
            .find({
                memberIds: { $elemMatch: { $eq: memberId } },
                type: { $in: [QuestType.initiation, QuestType.introduction] },
            })
            .map(this._instantiate)
        const res = await cursor.toArray()
        await cursor.close()
        return res
    }
}
