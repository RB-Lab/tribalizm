import { IQuest } from './entities/quest'
import { Storable } from './entities/store'
import { ContextUser } from './utils/context-user'

export class QuestFinale extends ContextUser {
    imDone = async (req: ImDoneRequest) => {
        const quest = await this.getQuest(req.questId)
        quest.finish(req.memberId)
        await this.stores.questStore.save(quest)
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

        this.stores.questStore.save(quest)
        await this.maybeCastVote(quest, req.memberId, req.voteForId)
    }
    castWisdom = async (req: WisdomCastRequest) => {
        const quest = await this.getQuest(req.questId)
        quest.castWisdom(req.memberId, req.voteForId, req.wisdom)

        this.stores.questStore.save(quest)
        await this.maybeCastVote(quest, req.memberId, req.voteForId)
    }

    private async maybeCastVote(
        quest: IQuest & Storable,
        memberId: string,
        voteForId: string
    ) {
        const action = quest.getNextVoteAction(memberId)
        if (action?.memberId !== voteForId) {
            const member = await this.getMember(voteForId)
            const vote = quest.votedMembers[memberId][voteForId]
            member.castVote({
                type: 'quest-vote',
                casted: Date.now(),
                charisma: vote.charisma,
                wisdom: vote.wisdom,
                memberId: memberId,
                questId: quest.id,
            })
            this.stores.memberStore.save(member)
        }
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
