import { BrainstormStore, IdeasStore, QuestIdea } from './entities/brainstorm'
import { Member, MembersStore } from './entities/member'
import { EntityNotFound } from './entities/not-found-error'
import { Quest, QuestsStore } from './entities/quest'

export class IdeasIncarnation {
    private ideasStore: IdeasStore
    private membersStore: MembersStore
    private barinstormStore: BrainstormStore
    private questsStore: QuestsStore
    constructor(
        ideasStore: IdeasStore,
        barinstormStore: BrainstormStore,
        membersStore: MembersStore,
        questsStore: QuestsStore
    ) {
        this.ideasStore = ideasStore
        this.barinstormStore = barinstormStore
        this.membersStore = membersStore
        this.questsStore = questsStore
    }

    incarnateIdeas = async (brainstormId: string) => {
        const brainstorm = await this.barinstormStore.getById(brainstormId)
        if (!brainstorm) {
            throw new EntityNotFound(`Brainstorm ${brainstormId} not found`)
        }
        const ideas = await this.ideasStore.find({ brainstormId })
        const members = await this.membersStore.find({
            tribeId: brainstorm.tribeId,
        })

        const quests = await Promise.all(
            ideas
                .filter((i) => i.getScore() > 1)
                .sort((a, b) => b.getScore() - a.getScore())
                .slice(0, Math.ceil(members.length / 2))
                .map(this.incarnate)
        )

        this.questsStore.save(quests)
        ideas.forEach((i) => i.finish())
        brainstorm.finish()
        this.ideasStore.save(ideas)
        this.barinstormStore.save(brainstorm)
    }

    private incarnate = async (idea: QuestIdea) => {
        const oneWeekAhead = Date.now() + 7 * 24 * 3_600_000
        const upvoterIds = idea.votes
            .filter((v) => v.vote === 'up')
            .map((v) => v.memberId)
        const memberIds = [...upvoterIds, idea.meberId]
        const members = await this.membersStore.find({
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
        const activeQuests = await this.questsStore.getActiveQuestsCount(
            memberIds
        )
        let assignies: string[]
        if (activeQuests[starter.id] <= minQuests(activeQuests)) {
            const second = getMaxFreeMember(
                members,
                'wisdom',
                activeQuests,
                starter
            )
            assignies = [starter.id, second.id]
        } else {
            const first = getMaxFreeMember(members, 'charisma', activeQuests)
            const second = getMaxFreeMember(
                members,
                first.charisma > first.wisdom ? 'wisdom' : 'charisma',
                activeQuests,
                first
            )
            assignies = [first.id, second.id]
        }

        return new Quest({
            description: idea.description,
            date: new Date(oneWeekAhead),
            memberIds: assignies,
        })
    }
}
function minQuests(activeQuests: { [id: string]: number }) {
    const counts = Object.values(activeQuests)
    return counts.length ? Math.min(...counts) || 0 : 0
}

function getMaxFreeMember(
    members: Member[],
    trait: 'charisma' | 'wisdom',
    activeQuests: Record<string, number>,
    exclude?: Member
) {
    const freeMembersSorted = members
        .slice()
        .sort((a, b) => b[trait] - a[trait])
        .filter((m) => {
            if (exclude && exclude.id === m.id) return false
            return (activeQuests[m.id] || 0) <= minQuests(activeQuests)
        })
    if (!freeMembersSorted.length) {
        throw new Error(
            `Cannot assign quest: not enoug members (${members.length})`
        )
    }
    return freeMembersSorted[0]
}
