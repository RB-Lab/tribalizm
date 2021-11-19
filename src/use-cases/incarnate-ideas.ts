import { SavedQuestIdea } from './entities/brainstorm'
import { Quest } from './entities/quest'
import { NewCoordinationQuestMessage } from './utils/quest-message'
import { ContextUser } from './utils/context-user'
import { getBestFreeMember, minQuests } from './utils/members-utils'
import { StormFinalyze } from './utils/scheduler'
import { Storable } from './entities/store'
import { EntityNotFound } from './utils/not-found-error'

export class IdeasIncarnation extends ContextUser {
    incarnateIdeas = async (task: StormFinalyze & Storable) => {
        const brainstorm = await this.getBrainstorm(task.payload.brainstormId)
        const ideas = await this.stores.ideaStore.find({
            brainstormId: brainstorm.id,
        })
        const members = await this.stores.memberStore.find({
            tribeId: brainstorm.tribeId,
        })
        const users = await this.stores.userStore.find({
            id: members.map((m) => m.userId),
        })
        const memberIdToUserName = members.reduce<Record<string, string>>(
            (result, member) => {
                const user = users.find((u) => u.id === member.userId)
                if (!user) {
                    throw new EntityNotFound(
                        `Cannot find user for ${member.id}`
                    )
                }
                return { ...result, [member.id]: user.name }
            },
            {}
        )

        const quests = await Promise.all(
            ideas
                .filter((i) => i.getScore() > 1)
                .sort((a, b) => b.getScore() - a.getScore())
                .slice(0, Math.ceil(members.length / 2))
                .map(this.incarnate)
        )

        const savedQuests = await this.stores.questStore.saveBulk(quests)
        ideas.forEach((i) => i.finish())
        brainstorm.finish()
        await this.stores.ideaStore.saveBulk(ideas)
        await this.stores.brainstormStore.save(brainstorm)

        savedQuests.forEach((quest) => {
            quest.memberIds.forEach((targetMemberId) => {
                const member = members.find((m) => m.id == targetMemberId)
                if (!member) {
                    throw new EntityNotFound(
                        `Cannot find member ${targetMemberId} amont tribe members`
                    )
                }
                this.notify<NewCoordinationQuestMessage>({
                    type: 'new-coordination-quest-message',
                    payload: {
                        questId: quest.id,
                        targetMemberId,
                        targetUserId: member.userId,
                        description: quest.description,
                        place: null,
                        time: null,
                        members: quest.memberIds.map((id) => ({
                            id,
                            name: memberIdToUserName[id],
                        })),
                    },
                })
            })
        })
        await this.scheduler.markDone(task.id)
    }

    private incarnate = async (idea: SavedQuestIdea) => {
        const oneWeekAhead = Date.now() + 7 * 24 * 3_600_000
        const upvoterIds = idea.votes
            .filter((v) => v.vote === 'up')
            .map((v) => v.memberId)
        const memberIds = [...upvoterIds, idea.meberId]
        const members = await this.stores.memberStore.find({
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

        return new Quest({
            ideaId: idea.id,
            description: idea.description,
            time: oneWeekAhead,
            memberIds: [first.id, second.id],
        })
    }
}
