import { ApplicationMessage } from './apply-tribe'
import { ApplicationPhase, IApplication } from './entities/application'
import { SavedMember } from './entities/member'
import { Quest, QuestType } from './entities/quest'
import { QuestMessage } from './utils/quest-message'
import { ContextUser } from './utils/context-user'
import { Message } from './utils/message'
import { IntroductionTask } from './utils/scheduler'

export class Initiation extends ContextUser {
    startInitiation = async (req: InitiationRequest) => {
        const app = await this.getApplication(req.applicationId)
        if (!app.chiefId) {
            throw new NoChiefSetError(
                `Cannot initiate ${req.applicationId}: chief is not assigned`
            )
        }
        const elder = await this.getTribeMemberByUserId(
            app.tribeId,
            req.elderUserId
        )
        this.checkElder(app.chiefId, elder.id, app.memberId)
        if (app.phase !== ApplicationPhase.initial) {
            throw new WrongPhaseError(
                `Cannot startInitiation when application is in "${app.phase}" phase`
            )
        }
        const quest = await this.stores.questStore.save(
            new Quest({
                type: QuestType.initiation,
                time: req.time,
                place: req.place,
                memberIds: [app.chiefId, app.memberId],
                acceptedIds: [app.chiefId],
            })
        )
        const targetUserId = await this.getUserIdByTribeMemberId(
            app.tribeId,
            app.memberId
        )
        this.notify<QuestMessage>({
            type: 'new-quest-message',
            payload: {
                ...quest,
                questId: quest.id,
                targetUserId,
            },
        })
        app.nextPhase()
        await this.stores.applicationStore.save(app)
    }
    approveByChief = async (req: ChiefApprovalRequest) => {
        const app = await this.getApplication(req.applicationId)
        const elder = await this.getTribeMemberByUserId(
            app.tribeId,
            req.elderUserId
        )
        this.checkElder(app.chiefId, elder.id, app.memberId)

        if (app.phase !== ApplicationPhase.chiefInitiation) {
            throw new WrongPhaseError(
                `Cannot startShamanInitiation when application is in "${app.phase}" phase`
            )
        }
        const tribe = await this.getTribe(app.tribeId)

        const member = await this.getMember(app.memberId)

        const user = await this.getUser(member.userId)

        if (tribe.shamanId && tribe.shamanId !== tribe.chiefId) {
            const shaman = await this.getMember(tribe.shamanId)
            app.nextPhase()
            app.shamanId = tribe.shamanId
            await this.stores.applicationStore.save(app)
            this.notify<ApplicationMessage>({
                type: 'application-message',
                payload: {
                    elderUserId: shaman.userId,
                    tribeName: tribe.name,
                    applicationId: app.id,
                    coverLetter: app.coverLetter,
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
        const elder = await this.getTribeMemberByUserId(
            app.tribeId,
            req.elderUserId
        )
        this.checkElder(app.shamanId, elder.id, app.memberId)

        // TODO mustn't quest and next phase be wrapped in transaction?
        //      and notification kinda as well.. must be assured.
        const quest = await this.stores.questStore.save(
            new Quest({
                type: QuestType.initiation,
                time: req.time,
                place: req.place,
                memberIds: [app.shamanId, app.memberId],
                acceptedIds: [app.shamanId],
            })
        )
        this.notify<QuestMessage>({
            type: 'new-quest-message',
            payload: {
                ...quest,
                questId: quest.id,
                targetUserId: app.memberId,
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
        const elder = await this.getTribeMemberByUserId(
            app.tribeId,
            req.elderUserId
        )
        this.checkElder(app.shamanId, elder.id, app.memberId)

        // TODO move the following to private method 'approve'
        const member = await this.getMember(app.memberId)

        await this.approve(app, member)
    }
    decline = async (req: DeclineRequest) => {
        const app = await this.getApplication(req.applicationId)
        const elder = await this.getTribeMemberByUserId(
            app.tribeId,
            req.elderUserId
        )
        if (app.chiefId === elder.id) {
            if (
                ![
                    ApplicationPhase.chiefInitiation,
                    ApplicationPhase.initial,
                ].includes(app.phase)
            ) {
                throw new WrongPhaseError(
                    `Cannot decline by chief when application is in "${app.phase}" phase`
                )
            }
        } else if (app.shamanId === elder.id) {
            if (app.phase !== ApplicationPhase.shamanInitiation) {
                throw new WrongPhaseError(
                    `Cannot decline by shaman when application is in "${app.phase}" phase`
                )
            }
        } else {
            throw new ElderMismatchError(
                `Member ${elder.id} is not allowed to initiate member ${app.memberId}`
            )
        }
        app.decline()
        const userId = await this.getUserIdByTribeMemberId(
            app.tribeId,
            app.memberId
        )
        const tribe = await this.getTribe(app.tribeId)
        await this.stores.applicationStore.save(app)
        this.notify<ApplicationDeclined>({
            type: 'application-declined',
            payload: {
                targetUserId: userId,
                tribeName: tribe.name,
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
        const members = (
            await this.stores.memberStore.find({
                tribeId: app.tribeId,
            })
        ).filter(
            (m) =>
                m.id !== app.chiefId &&
                m.id !== app.shamanId &&
                m.id !== member.id
        )
        if (members.length < 1) {
            return
        }
        const n = Math.floor(Math.random() * members.length)
        this.scheduler.schedule<IntroductionTask>({
            type: 'intorduction-quest',
            done: false,
            time: Date.now() + 20 * 3_600_000,
            payload: {
                newMemberId: member.id,
                oldMemberId: members[n].id,
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
    elderUserId: string
}

export type ChiefApprovalRequest = ApplicationChangeRequest
export type ShamanApprovalRequest = ApplicationChangeRequest
export type DeclineRequest = ApplicationChangeRequest

export interface ApplicationApproved extends Message {
    type: 'application-approved'
    payload: {
        targetMemberId: string
    }
}
export interface ApplicationDeclined extends Message {
    type: 'application-declined'
    payload: {
        targetUserId: string
        tribeName: string
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
