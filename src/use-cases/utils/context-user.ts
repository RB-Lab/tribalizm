import { SavedMember } from '../entities/member'
import { IQuestData, isInitiationQuest, NotYourQuest } from '../entities/quest'
import { Context, Stores } from './context'
import { Message } from './message'
import { Scheduler } from './scheduler'
import { EntityNotFound, WrongQuestTypeError } from './errors'

export class StoreUser {
    protected stores: Stores
    constructor(stores: Stores) {
        this.stores = stores
    }

    protected async getQuest(questId: string) {
        const quest = await this.stores.questStore.getById(questId)
        if (!quest) {
            throw new EntityNotFound(`Quest ${questId} not found`)
        }
        return quest
    }

    protected async getInitiationQuest(questId: string) {
        const quest = await this.stores.questStore.getById(questId)
        if (!quest) {
            throw new EntityNotFound(`Quest ${questId} not found`)
        }
        if (!isInitiationQuest(quest)) {
            throw new WrongQuestTypeError(
                `Quest ${quest.id} is not initiation quest (${quest.type})`
            )
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

    protected async getMembersViews(members: string[] | SavedMember[]) {
        if (isArrayOfStrings(members)) {
            members = await this.stores.memberStore.findSimple({ id: members })
        }
        const users = await this.stores.userStore.findSimple({
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
    protected async getTribeMemberByUserId(tribeId: string, userId: string) {
        const members = await this.stores.memberStore.findSimple({
            tribeId,
            userId,
        })
        if (!members.length) {
            throw new EntityNotFound(
                `Cannot find member in tribe ${tribeId} for user ${userId}`
            )
        }
        return members[0]
    }

    protected async getQuestMemberByUserId(quest: IQuestData, userId: string) {
        const members = await this.stores.memberStore.findSimple({
            id: quest.memberIds,
        })

        const member = members.find((m) => m.userId === userId)
        if (!member) {
            throw new NotYourQuest(
                `User ${userId} is not assigned to quest ${quest.id}`
            )
        }
        return member
    }
}

export class ContextUser extends StoreUser {
    protected bus: Context['async']['notificationBus']
    protected scheduler: Scheduler
    constructor(context: Context) {
        super(context.stores)
        this.bus = context.async.notificationBus
        this.scheduler = new Scheduler(this.stores.taskStore)
    }
    protected notify<T extends Message>(message: T) {
        return this.bus.notify<T>(message)
    }
}

function isArrayOfStrings<T>(arr: Array<T | string>): arr is string[] {
    return arr.every((i) => typeof i === 'string')
}
