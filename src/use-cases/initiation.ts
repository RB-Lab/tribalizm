import { ApplicationMessage } from './apply-tribe'
import { ApplicationPhase, IApplication } from './entities/application'
import { SavedMember } from './entities/member'
import { Quest, QuestType } from './entities/quest'
import { QuestMessage } from './utils/quest-message'
import { ContextUser } from './utils/context-user'
import { Message } from './utils/message'

export class Initiation extends ContextUser {
    startInitiation = async (req: InitiationRequest) => {
        const app = await this.getApplication(req.applicationId)
        if (!app.chiefId) {
            throw new NoChiefSetError(
                `Cannot initiate ${req.applicationId}: chief is not assigned`
            )
        }
        this.checkElder(app.chiefId, req.memberId, app.memberId)
        if (app.phase !== ApplicationPhase.initial) {
            throw new WrongPhaseError(
                `Cannot startInitiation when application is in "${app.phase}" phase`
            )
        }
        const newQuest = new Quest({
            type: QuestType.initiation,
            time: req.time,
            place: req.place,
            memberIds: [app.chiefId, app.memberId],
        })
        const quest = await this.stores.questStore.save(newQuest)
        this.notify<QuestMessage>({
            type: 'new-quest-message',
            payload: {
                ...quest,
                questId: quest.id,
                targetMemberId: app.memberId,
            },
        })
        app.nextPhase()
        await this.stores.applicationStore.save(app)
    }
    approveByChief = async (req: ChiefApprovalRequest) => {
        const app = await this.getApplication(req.applicationId)
        this.checkElder(app.chiefId, req.memberId, app.memberId)

        if (app.phase !== ApplicationPhase.chiefInitiation) {
            throw new WrongPhaseError(
                `Cannot startShamanInitiation when application is in "${app.phase}" phase`
            )
        }
        const tribe = await this.getTribe(app.tribeId)

        const member = await this.getMember(app.memberId)

        const user = await this.getUser(member.userId)

        if (tribe.shamanId) {
            app.nextPhase()
            app.shamanId = tribe.shamanId
            await this.stores.applicationStore.save(app)
            this.notify<ApplicationMessage>({
                type: 'application-message',
                payload: {
                    applicationId: app.id,
                    coverLetter: app.coverLetter,
                    elderId: tribe.shamanId,
                    userName: user.name,
                },
            })
        } else {
            await this.approve(app, member)
        }
    }
    startShamanInitiation = async (req: InitiationRequest) => {
        const app = await this.getApplication(req.applicationId)
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
        this.checkElder(app.shamanId, req.memberId, app.memberId)

        // TODO mustn't quest and next phase be wrapped in transaction?
        //      and notification kinda as well.. must be assured.
        const newQuest = new Quest({
            type: QuestType.initiation,
            time: req.time,
            place: req.place,
            memberIds: [app.shamanId, app.memberId],
        })
        const quest = await this.stores.questStore.save(newQuest)
        this.notify<QuestMessage>({
            type: 'new-quest-message',
            payload: {
                ...quest,
                questId: quest.id,
                targetMemberId: app.memberId,
            },
        })
        app.nextPhase()
        this.stores.applicationStore.save(app)
    }
    approveByShaman = async (req: ShamanApprovalRequest) => {
        const app = await this.getApplication(req.applicationId)
        if (app.phase !== ApplicationPhase.shamanInitiation) {
            throw new WrongPhaseError(
                `Cannot approveByShaman when application is in "${app.phase}" phase`
            )
        }
        this.checkElder(app.shamanId, req.memberId, app.memberId)

        // TODO move the following to private method 'approve'
        const member = await this.getMember(app.memberId)

        await this.approve(app, member)
    }
    decline = async (req: DeclineRequest) => {
        const app = await this.getApplication(req.applicationId)
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
        await this.stores.applicationStore.save(app)
        this.notify<ApplicationDeclined>({
            type: 'application-declined',
            payload: {
                targetMemberId: app.memberId,
            },
        })
    }

    private checkElder(
        expectingElderId: string | null,
        actualElderId: string,
        initiatingMemberId: string
    ) {
        if (expectingElderId !== actualElderId) {
            throw new ElderMismatchError(
                `Member ${actualElderId} is not allowed to initiate member ${initiatingMemberId}`
            )
        }
    }

    private async approve(app: IApplication, member: SavedMember) {
        app.approve()
        member.isCandidate = false
        await this.stores.memberStore.save(member)
        await this.stores.applicationStore.save(app)
        this.notify<ApplicationApproved>({
            type: 'application-approved',
            payload: {
                targetMemberId: member.id,
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

export interface ApplicationApproved extends Message {
    type: 'application-approved'
    payload: {
        targetMemberId: string
    }
}
export interface ApplicationDeclined extends Message {
    type: 'application-declined'
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
