import { Application, ApplicationStore } from './entities/application'
import { Member, MembersStore } from './entities/member'
import { Message } from './entities/message'
import { EntityNotFound } from './entities/not-found-error'
import { NotificationBus } from './entities/notification-bus'
import { Quest, QuestsStore, QuestType } from './entities/quest'
import { TribeStore } from './entities/tribe'
import { UserStore } from './entities/user'

export class TribeApplication {
    private applicationStore: ApplicationStore
    private notififcationBus: NotificationBus
    private tribeStore: TribeStore
    private memberStore: MembersStore
    private userStore: UserStore
    private questStore: QuestsStore
    constructor(
        notififcationBus: NotificationBus,
        applicationStore: ApplicationStore,
        tribeStore: TribeStore,
        memberStore: MembersStore,
        userStore: UserStore,
        questStore: QuestsStore
    ) {
        this.applicationStore = applicationStore
        this.notififcationBus = notififcationBus
        this.tribeStore = tribeStore
        this.memberStore = memberStore
        this.userStore = userStore
        this.questStore = questStore
    }

    appyToTribe = async (
        userId: string,
        tribeId: string,
        coverLetter: string
    ) => {
        const user = await this.userStore.getById(userId)
        const tribe = await this.tribeStore.getById(tribeId)
        if (!user) {
            throw new EntityNotFound(`User ${userId} not found`)
        }
        if (!tribe) {
            throw new EntityNotFound(`Tribe ${tribeId} not found`)
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
                elderId: tribe.chiefId,
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
    }

    startInitiation = async (req: InitiationRequest) => {
        const app = await this.applicationStore.getById(req.applicationId)
        if (!app) {
            throw new EntityNotFound(
                `Application ${req.applicationId} not found`
            )
        }
        if (!app.elderId) {
            throw new NoElderSetError(
                `Cannot initiate ${req.applicationId}: elder is not assigned`
            )
        }
        if (app.elderId !== req.memberId) {
            throw new ElderMismatchError(
                `Member ${req.memberId} is not allowed to initiate member ${app.memberId}`
            )
        }
        const newQuest = new Quest({
            type: QuestType.initiation,
            date: req.time,
            place: req.place,
            memberIds: [app.elderId, app.memberId],
        })
        const quest = await this.questStore.save(newQuest)
        this.notififcationBus.notify<QuestMessage>({
            type: QuestMessageType,
            payload: {
                place: req.place,
                questId: quest.id,
                targetId: app.memberId,
                questType: quest.type,
                time: req.time,
            },
        })
        app.nextPhase()
        await this.applicationStore.save(app)
    }
}

export interface InitiationRequest {
    applicationId: string
    memberId: string
    place: string
    time: number
}

export const ApplicationMessageType = 'application-message'
export interface ApplicationMessage extends Message {
    type: typeof ApplicationMessageType
    payload: {
        elderId: string
        applicationId: string
        userName: string
        coverLetter: string
    }
}

export const QuestMessageType = 'application-message'
export interface QuestMessage extends Message {
    type: typeof QuestMessageType
    payload: {
        targetId: string
        questId: string
        questType: QuestType
        time: number
        place: string
    }
}

export class ElderMismatchError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export class NoElderSetError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
