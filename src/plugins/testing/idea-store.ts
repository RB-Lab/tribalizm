import {
    IdeaStore,
    IQuestIdea,
    QuestIdea,
    SavedQuestIdea,
} from '../../use-cases/entities/brainstorm'
import { InMemoryStore } from './in-memory-store'

export class InMemoryIdeaStore implements IdeaStore {
    private _store = new InMemoryStore<IQuestIdea>(QuestIdea)
    getById = (id: string) => this._store.getById(id)
    save = (idea: IQuestIdea) => this._store.save(idea)
    saveBulk = (ideas: IQuestIdea[]) => this._store.saveBulk(ideas)
    find = (query: { brainstormId?: string }) => this._store.find(query)
}
