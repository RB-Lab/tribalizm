import { SavedMember } from '../entities/member'
import { Context } from './context'
import { Message } from './message'
import { EntityNotFound } from './not-found-error'
import { Scheduler } from './scheduler'

export class ContextUser {
    protected stores: Context['stores']
    protected bus: Context['async']['notififcationBus']
    protected scheduler: Scheduler
    constructor(context: Context) {
        this.stores = context.stores
        this.bus = context.async.notififcationBus
        this.scheduler = new Scheduler(context.stores.taskStore)
    }
    protected notify<T extends Message>(message: T) {
        return this.bus.notify<T>(message)
    }

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

    protected async getTribeMemberByUserId(tribeId: string, userId: string) {
        const members = await this.stores.memberStore.find({ tribeId, userId })
        if (!members.length) {
            throw new EntityNotFound(
                `Cannot find member in tribe ${tribeId} for user ${userId}`
            )
        }
        return members[0]
    }

    protected async getMembersViews(members: string[] | SavedMember[]) {
        if (isArrayOfStrings(members)) {
            members = await this.stores.memberStore.find({ id: members })
        }
        const users = await this.stores.userStore.find({
            id: members.map((m) => m.userId),
        })

        return members.map((member) => {
            const user = users.find((u) => u.id === member.userId)
            if (!user) {
                throw new EntityNotFound(
                    `Cannot find user for member ${member.id}`
                )
            }
            return {
                userId: user.id,
                id: member.id,
                name: user.name,
            }
        })
    }
}

function isArrayOfStrings<T>(arr: Array<T | string>): arr is string[] {
    return arr.every((i) => typeof i === 'string')
}
