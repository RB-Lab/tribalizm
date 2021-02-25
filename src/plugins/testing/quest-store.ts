import { IQuest, QuestStore } from '../../use-cases/entities/quest'
import { InMemoryStore } from './in-memory-store'

export class InMemoryQuestStore extends InMemoryStore<IQuest>
    implements QuestStore {
    getActiveQuestsCount = async (memberIds: string[]) => {
        const res: Record<string, number> = {}
        Object.values(this._store).forEach((quest: IQuest) => {
            memberIds.forEach((mid) => {
                const questCount = quest.memberIds.includes(mid) ? 1 : 0
                res[mid] = (res[mid] || 0) + questCount
            })
        })
        return res
    }
}
