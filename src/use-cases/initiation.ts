import { mapify } from '../ts-utils'
import { ApplicationMessage } from './apply-tribe'
import { ApplicationPhase, IApplication } from './entities/application'
import { Quest, QuestType } from './entities/quest'
import { ContextUser } from './utils/context-user'
import { Message } from './utils/message'
import { IntroductionTask } from './utils/scheduler'

export class Initiation extends ContextUser {
    startInitiation = async (req: InitiationRequest) => {
        const { app } = await this.getQuestAndApplication(req.questId)
        if (!app.chiefId) {
            throw new NoChiefSetError(
                `Cannot initiate ${app.id}: chief is not assigned`
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
        app.nextPhase()
        await this.stores.applicationStore.save(app)
    }

    approveByElder = async (req: ApplicationChangeRequest) => {
        const { app } = await this.getQuestAndApplication(req.questId)
        const elder = await this.getTribeMemberByUserId(
            app.tribeId,
            req.elderUserId
        )
        const tribe = await this.getTribe(app.tribeId)
        // TODO make those methods private, leave only this one
        if (tribe.chiefId === elder.id) {
            this.approveByChief(req)
        } else {
            this.approveByShaman(req)
        }
    }
    approveByChief = async (req: ChiefApprovalRequest) => {
        const { app } = await this.getQuestAndApplication(req.questId)
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
            const newQuest = await this.stores.questStore.save(
                new Quest({
                    type: QuestType.initiation,
                    memberIds: [shaman.id, app.memberId],
                    applicationId: app.id,
                })
            )
            app.nextPhase()
            app.shamanId = tribe.shamanId
            await this.stores.applicationStore.save(app)
            this.notify<ApplicationMessage>({
                type: 'application-message',
                payload: {
                    targetUserId: shaman.userId,
                    targetMemberId: shaman.id,
                    tribeName: tribe.name,
                    qeuestId: newQuest.id,
                    coverLetter: app.coverLetter,
                    userName: user.name,
                },
            })
        } else {
            await this.approve(app)
        }
    }
    startShamanInitiation = async (req: InitiationRequest) => {
        const { app } = await this.getQuestAndApplication(req.questId)
        if (app.phase !== ApplicationPhase.awaitingShaman) {
            throw new WrongPhaseError(
                `Cannot startShamanInitiation when application is in "${app.phase}" phase`
            )
        }
        if (!app.shamanId) {
            throw new NoShamanSetError(
                `Cannot initiate ${app.id}: shaman is not assigned`
            )
        }
        const elder = await this.getTribeMemberByUserId(
            app.tribeId,
            req.elderUserId
        )
        this.checkElder(app.shamanId, elder.id, app.memberId)
        app.nextPhase()
        this.stores.applicationStore.save(app)
    }
    approveByShaman = async (req: ShamanApprovalRequest) => {
        const { app } = await this.getQuestAndApplication(req.questId)
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

        await this.approve(app)
    }
    decline = async (req: DeclineRequest) => {
        const { app, quest } = await this.getQuestAndApplication(req.questId)
        const elder = await this.getTribeMemberByUserId(
            app.tribeId,
            req.elderUserId
        )
        const newMember = await this.getMember(app.memberId)
        const tribe = await this.getTribe(app.tribeId)
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
        await this.stores.applicationStore.save(app)
        await this.stores.questStore.save(quest)
        this.notify<ApplicationDeclinedMessage>({
            type: 'application-declined',
            payload: {
                targetUserId: newMember.userId,
                tribeName: tribe.name,
            },
        })
    }

    howWasIt = async (req: { questId: string }) => {
        const quest = await this.getQuest(req.questId)
        const members = await this.stores.memberStore.find({
            id: quest.memberIds,
        })
        const membersViews = mapify(await this.getMembersViews(members))
        const tribe = await this.getTribe(members[0].tribeId)
        for (let member of members) {
            const otherMember = members.find((m) => m.id !== member.id)
            if (!otherMember) throw new Error('Not enough members')
            if (member.id === tribe.chiefId || member.id === tribe.shamanId) {
                this.notify<RequestApplicationFeedbackMessage>({
                    type: 'request-application-feedback',
                    payload: {
                        applicantName: membersViews[otherMember.id].name,
                        questId: quest.id,
                        targetMemberId: member.id,
                        targetUserId: member.userId,
                        tribe: tribe.name,
                    },
                })
            } else {
                const elder =
                    otherMember.id === tribe.chiefId ? 'chief' : 'shaman'
                this.notify<RequestElderFeedbackMessage>({
                    type: 'request-elder-feedback',
                    payload: {
                        elder,
                        elderId: otherMember.id,
                        elderName: membersViews[otherMember.id].name,
                        targetMemberId: member.id,
                        targetUserId: member.userId,
                    },
                })
            }
        }
    }

    private async getQuestAndApplication(questId: string) {
        const quest = await this.getQuest(questId)
        if (!quest.applicationId) {
            throw new WrongQuestError(
                `Quest ${quest.id} has no application attached`
            )
        }
        const app = await this.getApplication(quest.applicationId)
        return { quest, app }
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

    private async approve(app: IApplication) {
        const member = await this.getMember(app.memberId)
        app.approve()
        member.isCandidate = false
        await this.stores.memberStore.save(member)
        await this.stores.applicationStore.save(app)
        this.notify<ApplicationApprovedMessage>({
            type: 'application-approved',
            payload: {
                targetUserId: member.userId,
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

export interface ApplicationChangeRequest {
    questId: string
    // TODO think about memberId instead, if it looks like we're moving it around anyway
    elderUserId: string
}
export type InitiationRequest = ApplicationChangeRequest
export type ChiefApprovalRequest = ApplicationChangeRequest
export type ShamanApprovalRequest = ApplicationChangeRequest
export type DeclineRequest = ApplicationChangeRequest

export interface ApplicationApprovedMessage extends Message {
    type: 'application-approved'
    payload: {
        targetUserId: string
        targetMemberId: string
    }
}
export interface ApplicationDeclinedMessage extends Message {
    type: 'application-declined'
    payload: {
        targetUserId: string
        tribeName: string
    }
}

export interface RequestApplicationFeedbackMessage extends Message {
    type: 'request-application-feedback'
    payload: {
        targetUserId: string
        targetMemberId: string
        applicantName: string
        questId: string
        tribe: string
    }
}

export interface RequestElderFeedbackMessage extends Message {
    type: 'request-elder-feedback'
    payload: {
        targetUserId: string
        targetMemberId: string
        elder: 'chief' | 'shaman'
        elderName: string
        elderId: string
    }
}

export class ElderMismatchError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
export class WrongQuestError extends Error {
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
