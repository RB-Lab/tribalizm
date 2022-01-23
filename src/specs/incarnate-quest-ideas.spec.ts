import { Brainstorm, QuestIdea } from '../use-cases/entities/brainstorm'
import {
    CoordinationQuest,
    Quest,
    QuestStatus,
    QuestType,
} from '../use-cases/entities/quest'
import {
    IdeaIncarnationMessage,
    IdeasIncarnation,
} from '../use-cases/incarnate-ideas'
import { StormFinalize } from '../use-cases/utils/scheduler'
import { Storable } from '../use-cases/utils/store'
import { createContext, makeMessageSpy } from './test-context'

describe('When brainstorm is over', () => {
    describe('Ideas to quests incarnation', () => {
        it('incarnates quests from original idea', async () => {
            const world = await setUp()
            const { idea, quest } = await world.incarnateOneIdea()
            expect(quest.ideaId).toEqual(idea.id)
            expect(quest.description).toEqual(idea.description)
        })
        it('incarnates no more than half tribe count', async () => {
            const world = await setUp({ ideasCount: 5 })
            const votes = { up: world.members.length - 1, down: 0 }
            const ideas = await world.getIdeas()
            await Promise.all(ideas.map((i, n) => world.vote(n, votes)))

            await world.incarnation.incarnateIdeas(world.task)
            const quests = await world.questStore.findSimple({
                // @ts-ignore
                ideaId: ideas.map((i) => i.id),
            })
            expect(quests.length).toEqual(3)
        })
        it('incarnates only most popular ideas (& score >= 2)', async () => {
            const world = await setUp({ ideasCount: 6 })
            world.vote(0, { up: 4, down: 0 }) // +4 yes
            world.vote(1, { up: 2, down: 1 }) // +1 no
            world.vote(2, { up: 3, down: 0 }) // +3 yes
            world.vote(3, { up: 2, down: 0 }) // +2 no: yes, but 6th & 2th are more popular
            world.vote(4, { up: 0, down: 3 }) // -3 no
            world.vote(5, { up: 3, down: 0 }) // +3 yes

            await world.incarnation.incarnateIdeas(world.task)

            expect(await world.getQuestByIdeaN(0))
                .withContext('idea 0')
                .toBeTruthy()
            expect(await world.getQuestByIdeaN(2))
                .withContext('idea 2')
                .toBeTruthy()
            expect(await world.getQuestByIdeaN(5))
                .withContext('idea 5')
                .toBeTruthy()

            expect(await world.getQuestByIdeaN(1))
                .withContext('idea 1')
                .toBeFalsy()
            expect(await world.getQuestByIdeaN(3))
                .withContext('idea 3')
                .toBeFalsy()
            expect(await world.getQuestByIdeaN(4))
                .withContext('idea 4')
                .toBeFalsy()
        })
        it('incarnates to "coordination" quests', async () => {
            const world = await setUp()
            const { quest } = await world.incarnateOneIdea()
            expect(quest.type).toEqual(QuestType.coordination)
        })
        it('incarnates as "proposed" quest', async () => {
            const world = await setUp()
            const { quest } = await world.incarnateOneIdea()
            expect(quest.status).toEqual(QuestStatus.proposed)
        })
        it('proposes quest one week ahead', async () => {
            const world = await setUp()
            const { quest } = await world.incarnateOneIdea()
            const oneWeekAhead = Date.now() + 7 * 24 * 3_600_000
            expect(quest.time).toBeGreaterThan(oneWeekAhead - 1000)
            expect(quest.time).toBeLessThan(oneWeekAhead + 1000)
        })
        it('marks StormFinalize task as done', async () => {
            const world = await setUp()
            await world.incarnation.incarnateIdeas(world.task)
            const taskAfter = await world.taskStore.getById(world.task.id)
            expect(world.task.done).withContext('task before').toBe(false)
            expect(taskAfter!.done).withContext('task after').toBe(true)
        })
    })
    describe('Quests assignment', () => {
        it('assigns quest to two members', async () => {
            const world = await setUp()
            const { quest } = await world.incarnateOneIdea()
            expect(quest.memberIds.length).toEqual(2)
        })
        it('assigns it to idea starter', async () => {
            const world = await setUp()
            const { quest, idea } = await world.incarnateOneIdea()
            expect(quest.memberIds).toContain(idea.memberId)
        })

        it('should pick only upvoters', async () => {
            const world = await setUp({ membersCount: 7 })
            const idea = (await world.getIdeas())[0]
            idea.voteDown(world.members[1].id)
            idea.voteUp(world.members[2].id)
            idea.voteUp(world.members[3].id)
            idea.voteDown(world.members[4].id)
            idea.voteUp(world.members[5].id)
            idea.voteUp(world.members[6].id)
            await world.ideaStore.save(idea)
            await world.incarnation.incarnateIdeas(world.task)
            const quest = await world.getQuestByIdeaN(0)
            expect(quest.memberIds).not.toContain(world.members[1].id)
            expect(quest.memberIds).not.toContain(world.members[4].id)
        })
        it('should pick only those who has no active quests', async () => {
            const world = await setUp({ membersCount: 4 })
            await world.addQuests(world.members[0].id)
            await world.addQuests(world.members[3].id, 2)
            const { quest } = await world.incarnateOneIdea()
            expect(quest.memberIds).toContain(world.members[1].id)
            expect(quest.memberIds).toContain(world.members[2].id)
        })
        it("won't assign quest to the same person twice", async () => {
            const world = await setUp({ membersCount: 3 })
            await world.addQuests(world.members[0].id)
            const { quest } = await world.incarnateOneIdea()
            expect(quest.memberIds).toContain(world.members[1].id)
            expect(quest.memberIds).toContain(world.members[2].id)
        })
        it('should pick two even if everyone has active quests', async () => {
            const world = await setUp({ membersCount: 4 })
            await Promise.all(world.members.map((m) => world.addQuests(m.id)))
            const { quest } = await world.incarnateOneIdea()
            expect(quest.memberIds.length).toBe(2)
        })
    })
    describe('Quest notification', () => {
        it('notifies both members on quest proposal', async () => {
            const world = await setUp()
            const onIncarnation =
                world.spyOnMessage<IdeaIncarnationMessage>('idea-incarnation')
            const { quest } = await world.incarnateOneIdea()
            const member1 = await world.memberStore.getById(quest.memberIds[0])
            const member2 = await world.memberStore.getById(quest.memberIds[1])
            const user2 = await world.userStore.getById(member2!.userId)

            expect(onIncarnation).toHaveBeenCalledWith(
                jasmine.objectContaining<IdeaIncarnationMessage>({
                    type: 'idea-incarnation',
                    payload: {
                        questId: quest.id,
                        targetMemberId: member1!.id,
                        targetUserId: member1!.userId,
                        description: quest.description,
                        partner: user2!.name,
                    },
                })
            )
        })
    })
})

async function setUp({ ideasCount = 1, membersCount = 6 } = {}) {
    const context = await createContext()

    const incarnation = new IdeasIncarnation(context)
    const { members, tribe } = await context.testing.makeTribe(membersCount)
    const brainstorm = await context.stores.brainstormStore.save(
        new Brainstorm({
            tribeId: tribe.id,
            time: Date.now() + 100_500_000,
        })
    )
    const rawIdeas = range(ideasCount || 1).map(
        () =>
            new QuestIdea({
                brainstormId: brainstorm.id,
                description: 'let us FOO!',
                memberId: members[0].id,
            })
    )
    const ideas = await context.stores.ideaStore.saveBulk(rawIdeas)
    const task = (await context.stores.taskStore.save({
        time: Date.now(),
        done: false,
        type: 'brainstorm-to-finalize',
        payload: {
            brainstormId: brainstorm.id,
        },
    })) as StormFinalize & Storable

    const maxVotes = members.length - 1
    async function vote(ideaN: number, votes = { up: maxVotes, down: 0 }) {
        if (votes.up + votes.down > maxVotes) {
            throw new Error(
                `too many votes ${
                    votes.up + votes.down
                } maximum possible is ${maxVotes}`
            )
        }
        const idea = getIdeaByN(ideaN)
        members.slice(1, 1 + votes.up).forEach((m) => idea.voteUp(m.id))
        members
            .slice(1 + votes.up, votes.up + votes.down)
            .forEach((m) => idea.voteDown(m.id))
        await context.stores.ideaStore.save(idea)
    }
    function getIdeaByN(ideaN: number) {
        const idea = ideas[ideaN]
        if (!idea) {
            throw new Error(
                `idea ${ideaN} doesn't exist, max ideaN ${ideas.length - 1}`
            )
        }
        return idea
    }
    async function getQuestByIdeaN(ideaN: number) {
        const idea = getIdeaByN(ideaN)
        const quests = await context.stores.questStore.findSimple({
            // @ts-ignore
            ideaId: idea.id,
        })
        return quests[0] as CoordinationQuest
    }

    return {
        ...context.stores,
        ...context.async,
        incarnation,
        vote,
        getQuestByIdeaN,
        brainstorm,
        members,
        tribe,
        task,
        getIdeas: async () => {
            return await context.stores.ideaStore.findSimple({
                brainstormId: brainstorm.id,
            })
        },
        incarnateOneIdea: async () => {
            await vote(0, { up: members.length - 1, down: 0 })
            await incarnation.incarnateIdeas(task)
            return { quest: await getQuestByIdeaN(0), idea: getIdeaByN(0) }
        },
        addQuests: async (memberId: string, amount = 1) => {
            await Promise.all(
                range(amount).map((_) =>
                    context.stores.questStore.save(
                        new Quest({
                            memberIds: [memberId],
                        })
                    )
                )
            )
        },
        spyOnMessage: makeMessageSpy(context.async.notificationBus),
    }
}

function range(n: number) {
    return new Array(n).fill(0).map((_, i) => i)
}
