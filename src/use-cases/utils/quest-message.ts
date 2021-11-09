import { Message } from './message'
import { QuestType } from '../entities/quest'

export interface QuestMessage extends Message {
    type: 'new-quest-message'
    payload: {
        targetUserId: string
        questId: string
        description?: string
        type: QuestType
        time: number
        place?: string
        memberIds: string[]
    }
}

interface IntorductionPayload {
    type: QuestType.introduction
    userName: string
}
interface InitiationPaylaod {}
