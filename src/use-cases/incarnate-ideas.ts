import { Context } from './context'
import { SavedQuestIdea } from './entities/brainstorm'
import { Quest } from './entities/quest'
import { getBestFreeMember, minQuests } from './get-best-free-member'
import { EntityNotFound } from './not-found-error'
import { QuestMessage } from './quest-message'

export class IdeasIncarnation {
    private context: Context
    constructor(context: Context) {
        this.context = context
    }

    incarnateIdeas = async (brainstormId: string) => {
        const brainstorm = await this.context.stores.brainstormStore.getById(
            brainstormId
        )
        if (!brainstorm) {
            throw new EntityNotFound(`Brainstorm ${brainstormId} not found`)
        }
        const ideas = await this.context.stores.ideaStore.find({
            brainstormId,
        })
        const members = await this.context.stores.memberStore.find({
            tribeId: brainstorm.tribeId,
        })

        const quests = await Promise.all(
            ideas
                .filter((i) => i.getScore() > 1)
                .sort((a, b) => b.getScore() - a.getScore())
                .slice(0, Math.ceil(members.length / 2))
                .map(this.incarnate)
        )

        const savedQuests = await this.context.stores.questStore.saveBulk(
            quests
        )
        ideas.forEach((i) => i.finish())
        brainstorm.finish()
        await this.context.stores.ideaStore.saveBulk(ideas)
        await this.context.stores.brainstormStore.save(brainstorm)

        savedQuests.forEach((quest) => {
            quest.memberIds.forEach((targetMemberId) => {
                this.context.async.notififcationBus.notify<QuestMessage>({
                    type: 'new-quest-message',
                    payload: {
                        ...quest,
                        questId: quest.id,
                        targetMemberId,
                    },
                })
            })
        })
    }

    private incarnate = async (idea: SavedQuestIdea) => {
        const oneWeekAhead = Date.now() + 7 * 24 * 3_600_000
        const upvoterIds = idea.votes
            .filter((v) => v.vote === 'up')
            .map((v) => v.memberId)
        const memberIds = [...upvoterIds, idea.meberId]
        const members = await this.context.stores.memberStore.find({
            id: memberIds,
        })
        const starter = members.find((m) => m.id === idea.meberId)
        const others = members.filter((m) => m.id !== idea.meberId)
        if (!starter) {
            throw new Error('Cannot find member who submitted quest idea')
        }
        if (!others.length) {
            throw new Error('Cannot find upvoters')
        }
        const activeQuests = await this.context.stores.questStore.getActiveQuestsCount(
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

        return new Quest({
            ideaId: idea.id,
            description: idea.description,
            time: oneWeekAhead,
            memberIds: [first.id, second.id],
        })
    }
}
