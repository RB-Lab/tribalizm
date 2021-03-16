import { Context } from './context'
import { Message } from './message'
import { EntityNotFound } from './not-found-error'

export class ContextUser {
    protected stores: Context['stores']
    protected bus: Context['async']['notififcationBus']
    constructor(context: Context) {
        this.stores = context.stores
        this.bus = context.async.notififcationBus
    }
    protected notify<T extends Message>(message: T) {
        return this.bus.notify<T>(message)
    }

    // TODO replace all errors with error messages straight in use cases? 🤔
    protected async getQuest(questId: string) {
        const quest = await this.stores.questStore.getById(questId)
        if (!quest) {
            throw new EntityNotFound(`Quest ${questId} not found`)
        }
        return quest
    }
    protected async getIdea(ideaId: string) {
        const idea = await this.stores.ideaStore.getById(ideaId)
        if (!idea) {
            throw new EntityNotFound(`Idea ${ideaId} not found`)
        }
        return idea
    }

    protected async getMember(memberId: string) {
        const member = await this.stores.memberStore.getById(memberId)
        if (!member) {
            throw new EntityNotFound(`Member ${memberId} not found`)
        }
        return member
    }

    protected async getGathering(gatheringId: string) {
        const gathering = await this.stores.gatheringStore.getById(gatheringId)
        if (!gathering) {
            throw new EntityNotFound(`Gathering ${gatheringId} not found`)
        }
        return gathering
    }

    protected async getBrainstorm(brainstormId: string) {
        const brainstorm = await this.stores.brainstormStore.getById(
            brainstormId
        )
        if (!brainstorm) {
            throw new EntityNotFound(`Brainstorm ${brainstormId} not found`)
        }
        return brainstorm
    }

    protected async getUser(userId: string) {
        const user = await this.stores.userStore.getById(userId)
        if (!user) {
            throw new EntityNotFound(`User ${userId} not found`)
        }
        return user
    }

    protected async getTribe(tribeId: string) {
        const tribe = await this.stores.tribeStore.getById(tribeId)
        if (!tribe) {
            throw new EntityNotFound(`Tribe ${tribeId} not found`)
        }
        return tribe
    }
    protected async getApplication(applicationId: string) {
        const app = await this.stores.applicationStore.getById(applicationId)
        if (!app) {
            throw new EntityNotFound(`Application ${applicationId} not found`)
        }
        return app
    }
}
