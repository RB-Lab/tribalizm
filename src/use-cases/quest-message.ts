import { Message } from './message'
import { QuestType } from './entities/quest'

export interface QuestMessage extends Message {
    type: 'new-quest-message'
    payload: {
        targetMemberId: string
        questId: string
        description: string
        type: QuestType
        time: number
        place?: string
        memberIds: string[]
    }
}
