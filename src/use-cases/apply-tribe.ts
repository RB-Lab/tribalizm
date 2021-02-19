import {
    Application,
    ApplicationPhase,
    ApplicationStore,
} from './entities/application'
import { Member, MemberStore } from './entities/member'
import { Message } from './message'
import { EntityNotFound } from './not-found-error'
import { NotificationBus } from './notification-bus'
import { Quest, QuestStore, QuestType } from './entities/quest'
import { TribeStore } from './entities/tribe'
import { UserStore } from './entities/user'
import { Context } from './context'

export class TribeApplication {
    private applicationStore: ApplicationStore
    private notififcationBus: NotificationBus
    private tribeStore: TribeStore
    private memberStore: MemberStore
    private userStore: UserStore
    constructor(context: Context) {
        this.notififcationBus = context.async.notififcationBus
        this.applicationStore = context.stores.applicationStore
        this.tribeStore = context.stores.tribeStore
        this.memberStore = context.stores.memberStore
        this.userStore = context.stores.userStore
    }

    appyToTribe = async (
        userId: string,
        tribeId: string,
        coverLetter: string
    ) => {
        const user = await this.userStore.getById(userId)
        if (!user) {
            throw new EntityNotFound(`User ${userId} not found`)
        }
        const tribe = await this.tribeStore.getById(tribeId)
        if (!tribe) {
            throw new EntityNotFound(`Tribe ${tribeId} not found`)
        }
        if (!tribe.chiefId) {
            throw new NoChiefTribeError(`Tribe ${tribeId} has no chief`)
        }
        const chief = await this.memberStore.getById(tribe.chiefId)
        if (!chief) {
            throw new EntityNotFound(
                `Tribe "${tribe.name}" cheief (${tribe.chiefId}) cannot be found`
            )
        }
        const newMember = await this.memberStore.save(
            new Member({ userId: user.id, tribeId: tribe.id })
        )
        const app = await this.applicationStore.save(
            new Application({
                memberId: newMember.id,
                tribeId,
                coverLetter,
                chiefId: tribe.chiefId,
            })
        )
        this.notififcationBus.notify<ApplicationMessage>({
            type: 'application-message',
            payload: {
                elderId: chief.id,
                applicationId: app.id,
                coverLetter: app.coverLetter,
                userName: user.name,
            },
        })
        return app
    }
}

export class NoChiefTribeError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export interface ApplicationMessage extends Message {
    type: 'application-message'
    payload: {
        elderId: string
        applicationId: string
        userName: string
        coverLetter: string
    }
}
