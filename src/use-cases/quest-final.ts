import { Context } from './context'
import { SavedQuest } from './entities/quest'
import { EntityNotFound } from './not-found-error'

export class QuestFinal {
    private context: Context
    constructor(context: Context) {
        this.context = context
    }
    imDone = async (req: ImDoneRequest) => {
        const quest = await this.getQuest(req.questId)
        quest.finish(req.memberId)
        await this.context.stores.questStore.save(quest)
    }
    getNextVoteAction = async (req: NextMemberToVoteRequest) => {
        const quest = await this.getQuest(req.questId)
        const action = quest.getNextVoteAction(req.memberId)
        if (action === null) {
            return null
        }
        const member = await this.getMember(action.memberId)
        const user = await this.getUser(member.userId)
        return {
            ...action,
            memberName: user.name,
        }
    }

    castCharisma = async (req: CharismaCastRequest) => {
        const quest = await this.getQuest(req.questId)
        quest.castCharisma(req.memberId, req.voteForId, req.charisma)

        this.context.stores.questStore.save(quest)
        await this.maybeCastVote(quest, req.memberId, req.voteForId)
    }
    castWisdom = async (req: WisdomCastRequest) => {
        const quest = await this.getQuest(req.questId)
        quest.castWisdom(req.memberId, req.voteForId, req.wisdom)

        this.context.stores.questStore.save(quest)
        await this.maybeCastVote(quest, req.memberId, req.voteForId)
    }

    private async maybeCastVote(
        quest: SavedQuest,
        memberId: string,
        voteForId: string
    ) {
        const action = quest.getNextVoteAction(memberId)
        if (action?.memberId !== voteForId) {
            const member = await this.getMember(voteForId)
            const vote = quest.votedMembers[memberId][voteForId]
            member.castVote({
                casted: Date.now(),
                charisma: vote.charisma,
                wisdom: vote.wisdom,
                memberId: memberId,
                questId: quest.id,
            })
            this.context.stores.memberStore.save(member)
        }
    }

    private async getMember(memberId: string) {
        const member = await this.context.stores.memberStore.getById(memberId)
        if (!member) {
            throw new EntityNotFound(`Member ${memberId} not found`)
        }
        return member
    }

    private async getUser(userId: string) {
        const user = await this.context.stores.userStore.getById(userId)
        if (!user) {
            throw new EntityNotFound(`User ${userId} not found`)
        }
        return user
    }

    private async getQuest(questId: string) {
        const quest = await this.context.stores.questStore.getById(questId)
        if (!quest) {
            throw new EntityNotFound(`Quest ${questId} not found`)
        }
        return quest
    }
}

export interface QuestFinalRequest {
    memberId: string
    questId: string
}

export type ImDoneRequest = QuestFinalRequest
export type NextMemberToVoteRequest = QuestFinalRequest

export interface CharismaCastRequest extends QuestFinalRequest {
    voteForId: string
    charisma: number
}

export interface WisdomCastRequest extends QuestFinalRequest {
    voteForId: string
    wisdom: number
}
