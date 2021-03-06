import { IntroductionQuest, Quest, QuestType } from './entities/quest'
import { Storable } from './utils/store'
import { ContextUser } from './utils/context-user'
import { Message } from './utils/message'
import { IntroductionTask } from './utils/scheduler'

export class IntroductionQuests extends ContextUser {
    notifyOldMember = async (task: IntroductionTask & Storable) => {
        const newMember = await this.getMember(task.payload.newMemberId)
        const oldMember = await this.getMember(task.payload.oldMemberId)
        const user = await this.getUser(newMember.userId)
        const tribe = await this.getTribe(oldMember.tribeId)
        const quest = await this.stores.questStore.save(
            new IntroductionQuest({
                newMemberId: newMember.id,
                memberIds: [oldMember.id, newMember.id],
            })
        )
        this.notify<IntroMessage>({
            type: 'intro-request-message',
            payload: {
                tribe: tribe.name,
                targetUserId: oldMember.userId,
                questId: quest.id,
                newMemberName: user.name,
            },
        })
        await this.scheduler.markDone(task.id)
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
        targetUserId: string
        questId: string
        newMemberName: string
        tribe: string
    }
}
