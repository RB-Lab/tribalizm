import { Message } from './message'

export interface NewCoordinationQuestMessage extends Message {
    type: 'new-coordination-quest-message'
    payload: CoordinationPayload
}

interface QuestPayload {
    targetUserId: string
    targetMemberId: string
    questId: string
}
interface CoordinationPayload extends QuestPayload {
    description: string
    members: Array<{ id: string; name: string }>
    time: number | null
    place: string | null
}
