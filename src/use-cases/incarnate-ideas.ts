import { mapify } from '../ts-utils'
import { SavedQuestIdea } from './entities/brainstorm'
import { CoordinationQuest } from './entities/quest'
import { Storable } from './entities/store'
import { ContextUser } from './utils/context-user'
import { getBestFreeMember, minQuests } from './utils/members-utils'
import { Message } from './utils/message'
import { StormFinalize } from './utils/scheduler'

export class IdeasIncarnation extends ContextUser {
    incarnateIdeas = async (task: StormFinalize & Storable) => {
        const brainstorm = await this.getBrainstorm(task.payload.brainstormId)
        const ideas = await this.stores.ideaStore.find({
            brainstormId: brainstorm.id,
        })
        const members = await this.stores.memberStore.find({
            tribeId: brainstorm.tribeId,
        })
        const membersMap = mapify(members)
        const membersViews = mapify(await this.getMembersViews(members))

        const quests = await Promise.all(
            ideas
                .filter((i) => i.getScore() > 1)
                .sort((a, b) => b.getScore() - a.getScore())
                .slice(0, Math.ceil(members.length / 2))
                .map(this.incarnate)
        )
        const ideasMap = mapify(ideas)

        const savedQuests = await this.stores.questStore.saveBulk(quests)
        await this.stores.ideaStore.saveBulk(ideas)

        savedQuests.forEach((quest) => {
            if (!quest.ideaId) {
                return // impossible: just incarnated quests must have ideaId
            }
            const idea = ideasMap[quest.ideaId]

            const member = membersMap[idea.memberId]
            const partnerId = quest.memberIds.filter(
                (id) => id != idea.memberId
            )[0]
            const partner = membersViews[partnerId]

            this.notify<IdeaIncarnationMessage>({
                type: 'idea-incarnation',
                payload: {
                    questId: quest.id,
                    targetMemberId: idea.memberId,
                    targetUserId: member.userId,
                    description: quest.description,
                    partner: partner.name,
                },
            })
        })
        await this.scheduler.markDone(task.id)
    }

    private incarnate = async (idea: SavedQuestIdea) => {
        const oneWeekAhead = Date.now() + 7 * 24 * 3_600_000
        const upvoterIds = idea.votes
            .filter((v) => v.vote === 'up')
            .map((v) => v.memberId)
        const memberIds = [...upvoterIds, idea.memberId]
        const members = await this.stores.memberStore.find({
            id: memberIds,
        })
        const starter = members.find((m) => m.id === idea.memberId)
        const others = members.filter((m) => m.id !== idea.memberId)
        if (!starter) {
            throw new Error('Cannot find member who submitted quest idea')
        }
        if (!others.length) {
            throw new Error('Cannot find upvoters')
        }
        const activeQuests = await this.stores.questStore.getActiveQuestsCount(
            memberIds
        )
        let first = starter
        if ((activeQuests[starter.id] || 0) > minQuests(activeQuests)) {
            first = getBestFreeMember(members, 'charisma', activeQuests, [])
        }
        const second = getBestFreeMember(
            members,
            first.charisma > first.wisdom ? 'wisdom' : 'charisma',
            activeQuests,
            [first.id]
        )

        return new CoordinationQuest({
            parentQuestId: null,
            ideaId: idea.id,
            description: idea.description,
            time: oneWeekAhead,
            memberIds: [first.id, second.id],
        })
    }
}

export interface IdeaIncarnationMessage extends Message {
    type: 'idea-incarnation'
    payload: {
        targetUserId: string
        targetMemberId: string
        questId: string | null
        description: string
        partner: string
    }
}
