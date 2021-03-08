import { Context } from './context'
import { Message } from './message'
import { EntityNotFound } from './not-found-error'

export class ContextUser {
    protected context: Context
    constructor(context: Context) {
        this.context = context
    }
    protected notify<T extends Message>(message: T) {
        return this.context.async.notififcationBus.notify<T>(message)
    }

    // TODO replace all errors with error messages straight in use cases? 🤔
    protected async getQuest(questId: string) {
        const quest = await this.context.stores.questStore.getById(questId)
        if (!quest) {
            throw new EntityNotFound(`Quest ${questId} not found`)
        }
        return quest
    }
    protected async getIdea(ideaId: string) {
        const idea = await this.context.stores.ideaStore.getById(ideaId)
        if (!idea) {
            throw new EntityNotFound(`Idea ${ideaId} not found`)
        }
        return idea
    }

    protected async getMember(memberId: string) {
        const member = await this.context.stores.memberStore.getById(memberId)
        if (!member) {
            throw new EntityNotFound(`Idea ${memberId} not found`)
        }
        return member
    }

    protected async getGathering(gatheringId: string) {
        const gathering = await this.context.stores.gatheringStore.getById(
            gatheringId
        )
        if (!gathering) {
            throw new EntityNotFound(`Idea ${gatheringId} not found`)
        }
        return gathering
    }
}
