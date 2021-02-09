import {
    Application,
    ApplicationPhase,
    ApplicationStore,
} from './entities/application'
import { Member, MemberStore } from './entities/member'
import { Message } from './entities/message'
import { EntityNotFound } from './entities/not-found-error'
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
    private questStore: QuestStore
    constructor(context: Context) {
        this.notififcationBus = context.async.notififcationBus
        this.applicationStore = context.stores.applicationStore
        this.tribeStore = context.stores.tribeStore
        this.memberStore = context.stores.memberStore
        this.userStore = context.stores.userStore
        this.questStore = context.stores.questStore
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

    startInitiation = async (req: InitiationRequest) => {
        const app = await this.applicationStore.getById(req.applicationId)
        if (!app) {
            throw new EntityNotFound(
                `Application ${req.applicationId} not found`
            )
        }
        if (!app.chiefId) {
            throw new NoChiefSetError(
                `Cannot initiate ${req.applicationId}: chief is not assigned`
            )
        }
        if (app.chiefId !== req.memberId) {
            throw new ElderMismatchError(
                `Member ${req.memberId} is not allowed to initiate member ${app.memberId}`
            )
        }
        if (app.phase !== ApplicationPhase.initial) {
            throw new WrongPhaseError(
                `Cannot startInitiation when application is in "${app.phase}" phase`
            )
        }
        const newQuest = new Quest({
            type: QuestType.initiation,
            date: req.time,
            place: req.place,
            memberIds: [app.chiefId, app.memberId],
        })
        const quest = await this.questStore.save(newQuest)
        this.notififcationBus.notify<QuestMessage>({
            type: QuestMessageType,
            payload: {
                place: req.place,
                questId: quest.id,
                targetMemberId: app.memberId,
                questType: quest.type,
                time: req.time,
            },
        })
        app.nextPhase()
        await this.applicationStore.save(app)
    }
    approveByChief = async (req: ChiefApprovalRequest) => {
        const app = await this.applicationStore.getById(req.applicationId)
        if (!app) {
            throw new EntityNotFound(
                `Application ${req.applicationId} not found`
            )
        }
        if (app.phase !== ApplicationPhase.chiefInitiation) {
            throw new WrongPhaseError(
                `Cannot approveByChief when application is in "${app.phase}" phase`
            )
        }
        if (app.chiefId !== req.memberId) {
            throw new ElderMismatchError(
                `Member ${req.memberId} is not allowed to initiate member ${app.memberId}`
            )
        }
        const tribe = await this.tribeStore.getById(app.tribeId)
        if (!tribe) {
            throw new EntityNotFound(`Tribe ${app.tribeId} not found`)
        }

        const member = await this.memberStore.getById(app.memberId)
        if (!member) {
            throw new EntityNotFound(`Member ${app.memberId} not found`)
        }

        const user = await this.userStore.getById(member.userId)
        if (!user) {
            throw new EntityNotFound(`User ${member.userId} not found`)
        }

        if (tribe.shamanId) {
            app.nextPhase()
            app.shamanId = tribe.shamanId
            await this.applicationStore.save(app)
            this.notififcationBus.notify<ApplicationMessage>({
                type: 'application-message',
                payload: {
                    applicationId: app.id,
                    coverLetter: app.coverLetter,
                    elderId: tribe.shamanId,
                    userName: user.name,
                },
            })
        } else {
            app.approve()
            member.isCandidate = false
            await this.memberStore.save(member)
            await this.applicationStore.save(app)
            this.notififcationBus.notify<ApplicationApproved>({
                type: ApplicationApprovedMessageType,
                payload: {
                    targetMemberId: member.id,
                },
            })
        }
    }
    startShamanInitiation = async (req: InitiationRequest) => {
        const app = await this.applicationStore.getById(req.applicationId)
        if (!app) {
            throw new EntityNotFound(
                `Application ${req.applicationId} not found`
            )
        }
        if (app.phase !== ApplicationPhase.awaitingShaman) {
            throw new WrongPhaseError(
                `Cannot startShamanInitiation when application is in "${app.phase}" phase`
            )
        }
        if (!app.shamanId) {
            throw new NoShamanSetError(
                `Cannot initiate ${req.applicationId}: chief is not assigned`
            )
        }
        if (app.shamanId !== req.memberId) {
            throw new ElderMismatchError(
                `Member ${req.memberId} is not allowed to initiate member ${app.memberId}`
            )
        }

        // TODO mustn't quest and next phase be wrapped in transaction?
        //      and notification kinda as well.. must be assured.
        const newQuest = new Quest({
            type: QuestType.initiation,
            date: req.time,
            place: req.place,
            memberIds: [app.shamanId, app.memberId],
        })
        const quest = await this.questStore.save(newQuest)
        this.notififcationBus.notify<QuestMessage>({
            type: QuestMessageType,
            payload: {
                place: req.place,
                questId: quest.id,
                targetMemberId: app.memberId,
                questType: quest.type,
                time: req.time,
            },
        })
        app.nextPhase()
        this.applicationStore.save(app)
    }
    approveByShaman = async (req: ShamanApprovalRequest) => {
        const app = await this.applicationStore.getById(req.applicationId)
        if (!app) {
            throw new EntityNotFound(
                `Application ${req.applicationId} not found`
            )
        }
        if (app.phase !== ApplicationPhase.shamanInitiation) {
            throw new WrongPhaseError(
                `Cannot approveByShaman when application is in "${app.phase}" phase`
            )
        }
        if (app.shamanId !== req.memberId) {
            throw new ElderMismatchError(
                `Member ${req.memberId} is not allowed to initiate member ${app.memberId}`
            )
        }

        // TODO move the following to private method 'approve'
        const member = await this.memberStore.getById(app.memberId)
        if (!member) {
            throw new EntityNotFound(`Member ${app.memberId} not found`)
        }

        app.approve()
        member.isCandidate = false
        await this.memberStore.save(member)
        await this.applicationStore.save(app)
        this.notififcationBus.notify<ApplicationApproved>({
            type: ApplicationApprovedMessageType,
            payload: {
                targetMemberId: member.id,
            },
        })
    }
    decline = async (req: DeclineRequest) => {
        const app = await this.applicationStore.getById(req.applicationId)
        if (!app) {
            throw new EntityNotFound(
                `Application ${req.applicationId} not found`
            )
        }
        if (app.chiefId === req.memberId) {
            if (app.phase !== ApplicationPhase.chiefInitiation) {
                throw new WrongPhaseError(
                    `Cannot decline by chief when application is in "${app.phase}" phase`
                )
            }
        } else if (app.shamanId === req.memberId) {
            if (app.phase !== ApplicationPhase.shamanInitiation) {
                throw new WrongPhaseError(
                    `Cannot decline by shaman when application is in "${app.phase}" phase`
                )
            }
        } else {
            throw new ElderMismatchError(
                `Member ${req.memberId} is not allowed to initiate member ${app.memberId}`
            )
        }
        app.decline()
        await this.applicationStore.save(app)
        this.notififcationBus.notify<ApplicationDeclined>({
            type: 'application-declined',
            payload: {
                targetMemberId: app.memberId,
            },
        })
    }
}

export interface InitiationRequest extends ApplicationChangeRequest {
    place: string
    time: number
}

export interface ApplicationChangeRequest {
    applicationId: string
    memberId: string
}

export type ChiefApprovalRequest = ApplicationChangeRequest
export type ShamanApprovalRequest = ChiefApprovalRequest
export type DeclineRequest = ChiefApprovalRequest

export class NoChiefTribeError extends Error {
    constructor(msg: string) {
        super(msg)
    }
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
        targetMemberId: string
        questId: string
        questType: QuestType
        time: number
        place: string
    }
}

export const ApplicationApprovedMessageType = 'application-approved'
export interface ApplicationApproved extends Message {
    type: typeof ApplicationApprovedMessageType
    payload: {
        targetMemberId: string
    }
}
export const ApplicationDeclinedMessageType = 'application-declined'
export interface ApplicationDeclined extends Message {
    type: typeof ApplicationDeclinedMessageType
    payload: {
        targetMemberId: string
    }
}

export class ElderMismatchError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export class NoChiefSetError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
export class NoShamanSetError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export class WrongPhaseError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
