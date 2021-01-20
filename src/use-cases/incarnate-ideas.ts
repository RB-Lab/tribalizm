import { BrainstormStore, IdeasStore, QuestIdea } from './entities/brainstorm'
import { MembersStore } from './entities/member'
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
        const members = await this.membersStore.find({
            id: [...upvoterIds, idea.meberId],
        })
        const starter = members.find((m) => m.id === idea.meberId)
        const others = members.filter((m) => m.id !== idea.meberId)
        if (!starter) {
            throw new Error('Cannot find member who submitted quest idea')
        }
        if (!others.length) {
            throw new Error('Cannot find upvoters')
        }
        const memberIds = [starter.id, others[0].id]

        return new Quest({
            description: idea.description,
            date: new Date(oneWeekAhead),
            memberIds,
        })
    }
}
