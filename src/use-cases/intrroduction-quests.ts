import { Quest, QuestType } from './entities/quest'
import { Storable } from './entities/store'
import { ContextUser } from './utils/context-user'
import { Message } from './utils/message'
import { QuestMessage } from './utils/quest-message'
import { IntroductionTask } from './utils/scheduler'

export class IntroductionQuests extends ContextUser {
    notifyOldMember = async (task: IntroductionTask & Storable) => {
        const newMember = await this.getMember(task.payload.newMemberId)
        const user = await this.getUser(newMember.userId)
        this.notify<IntroMessage>({
            type: 'intro-request-message',
            payload: {
                newMemberId: newMember.id,
                newMemberName: user.name,
                targetMemberId: task.payload.oldMemberId,
            },
        })
        await this.scheduler.markDone(task.id)
    }
    createIntroQuest = async (req: IntroQuestRequest) => {
        const quest = await this.stores.questStore.save(
            new Quest({
                type: QuestType.introduction,
                memberIds: [req.newMemberId, req.memberId],
                time: req.time,
                acceptedIds: [req.memberId],
            })
        )
        this.notify<QuestMessage>({
            type: 'new-quest-message',
            payload: {
                targetUserId: req.newMemberId,
                questId: quest.id,
                ...quest,
            },
        })
    }
}

export interface IntroQuestRequest {
    memberId: string
    newMemberId: string
    place: string
    time: number
}

export interface IntroMessage extends Message {
    type: 'intro-request-message'
    payload: {
        targetMemberId: string
        newMemberId: string
        newMemberName: string
    }
}
