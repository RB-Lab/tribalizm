import { ApplicationMessage } from './apply-tribe'
import { InitiationQuest, QuestType } from './entities/quest'
import { ContextUser } from './utils/context-user'
import { Message } from './utils/message'
import { InitiationFeedbackTask, IntroductionTask } from './utils/scheduler'
import { Storable } from './utils/store'

/**
 * Handles feedback of initiation quests: approve, decline and request feedback notifications
 */
export class Initiation extends ContextUser {
    /**
     * Notifies elder that feedback for application is needed
     */
    notifyElder = async (task: InitiationFeedbackTask & Storable) => {
        const quest = await this.getInitiationQuest(task.payload.questId)
        const app = await this.getApplication(quest.applicationId)
        const member = await this.getMember(app.currentElderId)
        await this.scheduler.markDone(task.id)
        this.notify<RequestApplicationFeedbackMessage>({
            type: 'request-application-feedback',
            payload: {
                targetUserId: member.userId,
                questId: quest.id,
            },
        })
    }
    /**
     * Declines application, notifies the candidate that app has been declined
     */
    decline = async (req: DeclineRequest) => {
        const quest = await this.getInitiationQuest(req.questId)
        const app = await this.getApplication(quest.applicationId)
        const elder = await this.getTribeMemberByUserId(app.tribeId, req.userId)
        const newMember = await this.getMember(app.memberId)
        const tribe = await this.getTribe(app.tribeId)
        app.decline(elder.id)
        await this.stores.applicationStore.save(app)
        this.notify<ApplicationDeclinedMessage>({
            type: 'application-declined',
            payload: {
                targetUserId: newMember.userId,
                targetMemberId: newMember.id,
                tribeName: tribe.name,
            },
        })
    }

    /**
     * Approves application:
     *  - creates next initiation quest & notifies next oldie
     *  - when application is finished & approved – notifies the candidate & schedules intro
     */
    async approve(req: ApplicationChangeRequest) {
        const quest = await this.getInitiationQuest(req.questId)
        const app = await this.getApplication(quest.applicationId)
        const elder = await this.getTribeMemberByUserId(app.tribeId, req.userId)
        const newMember = await this.getMember(app.memberId)
        app.approve(elder.id)
        await this.stores.applicationStore.save(app)
        if (app.status == 'approved') {
            newMember.isCandidate = false
            await this.stores.memberStore.save(newMember)
            const tribe = await this.getTribe(app.tribeId)
            this.notify<ApplicationApprovedMessage>({
                type: 'application-approved',
                payload: {
                    tribe: tribe.name,
                    targetUserId: newMember.userId,
                    targetMemberId: newMember.id,
                },
            })
            const allInitQuests =
                await this.stores.questStore.getAllIntroQuests(newMember.id)
            const allParticipants = [
                ...new Set(allInitQuests.flatMap((q) => q.memberIds)),
            ]

            const members = (
                await this.stores.memberStore.findSimple({
                    tribeId: app.tribeId,
                })
            ).filter((m) => !allParticipants.includes(m.id))
            if (members.length < 1) {
                return
            }
            const n = Math.floor(Math.random() * members.length)
            this.scheduler.schedule<IntroductionTask>({
                type: 'introduction-quest',
                done: false,
                time: Date.now() + 20 * 3_600_000,
                payload: {
                    newMemberId: newMember.id,
                    oldMemberId: members[n].id,
                },
            })
        } else {
            const newQuest = await this.stores.questStore.save(
                new InitiationQuest({
                    memberIds: [app.currentElderId, app.memberId],
                    applicationId: app.id,
                })
            )
            const nextMember = await this.getMember(app.currentElderId)
            this.notify<ApplicationMessage>({
                type: 'application-message',
                payload: {
                    targetUserId: nextMember.userId,
                    questId: newQuest.id,
                },
            })
        }
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
        questId: string
    }
}
