import { Message } from './message'

export interface NewCoordinationQuestMessage extends Message {
    type: 'new-coordination-quest-message'
    payload: CoordinationPayload
}

export interface NewIntroductionQuestMessage extends Message {
    type: 'new-introduction-quest-message'
    payload: IntroductionPaylaod
}

interface QuestPayload {
    targetUserId: string
    targetMemberId: string
    questId: string
}
interface IntroductionPaylaod extends QuestPayload {
    userName: string
    time: number
    place: string
}
interface CoordinationPayload extends QuestPayload {
    description: string
    members: Array<{ id: string; name: string }>
    time: number | null
    place: string | null
}
