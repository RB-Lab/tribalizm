import { Context } from './context'
import { Message } from './message'
import { EntityNotFound } from './not-found-error'

export class QuestNegotiation {
    private context: Context

    constructor(context: Context) {
        this.context = context
    }
    proposeChange = async (req: QuestChangeRequest) => {
        const quest = await this.getQuest(req.questId)
        const targetMembers = quest.propose(req.time, req.place, req.memberId)
        await this.context.stores.questStore.save(quest)
        targetMembers.forEach((targetMemberId) => {
            this.context.async.notififcationBus.notify<QuestChangeMessage>({
                type: 'quest-change-proposed',
                payload: {
                    ...quest,
                    proposingMemberId: req.memberId,
                    questId: quest.id,
                    targetMemberId,
                },
            })
        })
    }
    acceptQuest = async (req: QuestAcceptRequest) => {
        const quest = await this.getQuest(req.questId)
        const targetMembers = quest.accept(req.memberId)
        await this.context.stores.questStore.save(quest)
        targetMembers.forEach((targetMemberId) => {
            this.context.async.notififcationBus.notify<QuestAcceptedMessage>({
                type: 'quest-accepted',
                payload: {
                    ...quest,
                    questId: quest.id,
                    targetMemberId,
                },
            })
        })
    }

    declineQuest = async (req: QuestDeclineRequest) => {
        const quest = await this.getQuest(req.questId)
        quest.decline(req.memberId)
        await this.context.stores.questStore.save(quest)
    }

    private async getQuest(questId: string) {
        const quest = await this.context.stores.questStore.getById(questId)
        if (!quest) {
            throw new EntityNotFound(`Quest ${questId} not found`)
        }
        return quest
    }
}

export interface QuestChangeMessage extends Message {
    type: 'quest-change-proposed'
    payload: {
        description: string
        questId: string
        proposingMemberId: string
        targetMemberId: string
        time: number
        place: string
    }
}

export interface QuestAcceptedMessage extends Message {
    type: 'quest-accepted'
    payload: {
        description: string
        questId: string
        targetMemberId: string
        time: number
        place: string
    }
}

export interface QuestChangeRequest extends QuestNegotiationRequest {
    time: number
    place: string
}
export interface QuestNegotiationRequest {
    questId: string
    memberId: string
}

export interface QuestAcceptRequest extends QuestNegotiationRequest {}
export interface QuestDeclineRequest extends QuestNegotiationRequest {}
