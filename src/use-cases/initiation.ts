import { ApplicationPhase, IApplication } from './entities/application'
import { isInitiationQuest } from './entities/quest'
import { ContextUser } from './utils/context-user'
import { Message } from './utils/message'
import { IntroductionTask } from './utils/scheduler'

export class Initiation extends ContextUser {
    startInitiation = async (req: InitiationRequest) => {
        const { app } = await this.getQuestAndApplication(req.questId)
        const elder = await this.getTribeMemberByUserId(app.tribeId, req.userId)
        if (app.phase !== ApplicationPhase.initial) {
            throw new WrongPhaseError(
                `Cannot startInitiation when application is in "${app.phase}" phase`
            )
        }
        app.nextPhase()
        await this.stores.applicationStore.save(app)
    }

    decline = async (req: DeclineRequest) => {
        const { app, quest } = await this.getQuestAndApplication(req.questId)
        const newMember = await this.getMember(app.memberId)
        const tribe = await this.getTribe(app.tribeId)
        app.decline()
        await this.stores.applicationStore.save(app)
        await this.stores.questStore.save(quest)
        this.notify<ApplicationDeclinedMessage>({
            type: 'application-declined',
            payload: {
                targetUserId: newMember.userId,
                targetMemberId: newMember.id,
                tribeName: tribe.name,
            },
        })
    }

    private async getQuestAndApplication(questId: string) {
        const quest = await this.getQuest(questId)
        if (!isInitiationQuest(quest)) {
            throw new WrongQuestError(
                `Quest ${quest.id} is not an initiation quest`
            )
        }
        const app = await this.getApplication(quest.applicationId)
        return { quest, app }
    }

    async approve(req: ApplicationChangeRequest) {
        const quest = await this.getQuest(req.questId)
        if (!isInitiationQuest(quest)) {
            throw new WrongQuestError(
                `Quest ${quest.id} is not initiation quest (${quest.type})`
            )
        }
        const app = await this.getApplication(quest.applicationId)
        const member = await this.getMember(app.memberId)
        app.approve()
        member.isCandidate = false
        await this.stores.memberStore.save(member)
        await this.stores.applicationStore.save(app)
        const tribe = await this.getTribe(app.tribeId)
        this.notify<ApplicationApprovedMessage>({
            type: 'application-approved',
            payload: {
                tribe: tribe.name,
                targetUserId: member.userId,
                targetMemberId: member.id,
            },
        })
        const members = (
            await this.stores.memberStore.findSimple({
                tribeId: app.tribeId,
            })
        ).filter(
            // TODO must filter out those who didn't participate in initiation
            (m) => true
        )
        if (members.length < 1) {
            return
        }
        const n = Math.floor(Math.random() * members.length)
        this.scheduler.schedule<IntroductionTask>({
            type: 'introduction-quest',
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
    userId: string
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
        tribe: string
    }
}
export interface ApplicationDeclinedMessage extends Message {
    type: 'application-declined'
    payload: {
        targetUserId: string
        targetMemberId: string
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

export class WrongQuestError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export class WrongPhaseError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
