import {
    IQuest,
    Quest,
    QuestStore,
    SavedQuest,
} from '../../use-cases/entities/quest'
import { InMemoryStore } from './in-memory-store'

export class InMemoryQuestStore implements QuestStore {
    private _store = new InMemoryStore<IQuest>(Quest)
    getById = (id: string) => this._store.getById(id)
    save = (quest: IQuest) => this._store.save(quest)

    saveBulk = (quests: IQuest[]) => this._store.saveBulk(quests)
    getActiveQuestsCount = async (memberIds: string[]) => {
        const res: Record<string, number> = {}
        Object.values(this._store.store).forEach((quest: IQuest) => {
            memberIds.forEach((mid) => {
                const questCount = quest.memberIds.includes(mid) ? 1 : 0
                res[mid] = (res[mid] || 0) + questCount
            })
        })
        return res
    }
    find = (query: { ideaId?: (string | null) | Array<string | null> }) =>
        this._store.find(query)
}
