import { BrainstormStore, IdeasStore } from './entities/brainstorm'
import { EntityNotFound } from './entities/not-found-error'

export class IdeasIncarnation {
    private ideasStore: IdeasStore
    private barinstormStore: BrainstormStore
    constructor(ideasStore: IdeasStore, barinstormStore: BrainstormStore) {
        this.ideasStore = ideasStore
        this.barinstormStore = barinstormStore
    }

    incarnateIdeas = async (brainstormId: string) => {
        const brainstorm = await this.barinstormStore.getById(brainstormId)
        if (!brainstorm) {
            throw new EntityNotFound(`Brainstorm ${brainstormId} not found`)
        }
        const ideas = await this.ideasStore.find({ brainstormId })
        ideas.forEach((i) => i.finish())
        brainstorm.finish()
        this.ideasStore.save(ideas)
        this.barinstormStore.save(brainstorm)
    }
}
