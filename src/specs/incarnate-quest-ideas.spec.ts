import { Context } from '../use-cases/utils/context'
import { Brainstorm, QuestIdea } from '../use-cases/entities/brainstorm'
import { Member } from '../use-cases/entities/member'
import { Quest, QuestStatus, QuestType } from '../use-cases/entities/quest'
import { Tribe } from '../use-cases/entities/tribe'
import { IdeasIncarnation } from '../use-cases/incarnate-ideas'
import { QuestMessage } from '../use-cases/utils/quest-message'
import { createContext } from './test-context'
import { StormFinalyze } from '../use-cases/utils/scheduler'
import { Storable } from '../use-cases/entities/store'

describe('When brainstorm is over', () => {
    describe('Ideas to quests incarnation', () => {
        it('incarnates quests from original idea', async () => {
            const world = await setUp()
            const { idea, quest } = await world.incarnateOneIdea()
            expect(quest.ideaId).toEqual(idea.id)
            expect(quest.description).toEqual(idea.description)
        })
        it('incarnates no more than half tribe count', async () => {
            const world = await setUp({ ideas: 5 })
            const votes = { up: world.members.length - 1, down: 0 }
            const ideas = await world.getIdeas()
            await Promise.all(ideas.map((i, n) => world.vote(n, votes)))

            await world.incarnation.incarnateIdeas(world.task)
            const quests = await world.questStore.find({
                ideaId: ideas.map((i) => i.id),
            })
            expect(quests.length).toEqual(3)
        })
        it('incarnates only most popular ideas (& score >= 2)', async () => {
            const world = await setUp({ ideas: 6 })
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
        it('finalises containing ideas', async () => {
            const world = await setUp({ ideas: 3 })
            await world.incarnation.incarnateIdeas(world.task)
            const ideas = await world.getIdeas()
            expect(ideas.length).toEqual(3)
            ideas.forEach((idea) => {
                expect(idea.state).toEqual('finished')
            })
        })
        it('finalises itself', async () => {
            const world = await setUp()
            await world.incarnation.incarnateIdeas(world.task)
            const brainstorm = await world.brainstormStore.getById(
                world.brainstorm.id
            )
            expect(brainstorm?.state).toEqual('finished')
        })
        it('makrs StormFinalyze task as done', async () => {
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
            expect(quest.memberIds).toContain(idea.meberId)
        })

        // TODO consinder this: we have 10 members tribe, three of them suggest
        //      9 ideas (3 each) and upvote all 9. Thus we will have 5 quests
        //      assigned between these 3 members (each have 3-4) while other
        //      7 passive tribesmen won't have any. ¯\_(ツ)_/¯ maybe that's OK.
        it('should pick only upvoters', async () => {
            const world = await setUp({
                members: [
                    ...defaultMembers,
                    defaultMembers[4],
                    defaultMembers[4],
                ],
            })
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
        it('should pick shaman for chief (starter)', async () => {
            const world = await setUp({
                members: [
                    { charisma: 10, wisdom: 6 }, // chief: 10 > 6
                    { charisma: 12, wisdom: 7 }, // also chief: 12 > 6
                    { charisma: 2, wisdom: 6 }, //  better shaman!
                    { charisma: 2, wisdom: 5 }, //  shaman
                    { charisma: 2, wisdom: 4 }, //  also shaman
                ],
            })
            const { quest, idea } = await world.incarnateOneIdea()
            expect(quest.memberIds).toContain(idea.meberId)
            expect(quest.memberIds).toContain(world.members[2].id)
        })
        it('should pick chief for shaman', async () => {
            const world = await setUp({
                members: [
                    { charisma: 2, wisdom: 5 }, // starter is shaman: 2 < 5
                    { charisma: 6, wisdom: 4 }, // chief
                    { charisma: 7, wisdom: 2 }, // better chief
                    { charisma: 8, wisdom: 12 }, // awesome, but also shaman
                    { charisma: 2, wisdom: 4 }, //  also shaman
                ],
            })
            const { quest, idea } = await world.incarnateOneIdea()
            expect(quest.memberIds).toContain(idea.meberId)
            expect(quest.memberIds).toContain(world.members[2].id)
        })
        it('should pick wisest cheif if no shamans in tribe', async () => {
            const world = await setUp({
                members: [
                    { charisma: 5, wisdom: 2 },
                    { charisma: 6, wisdom: 4 },
                    { charisma: 7, wisdom: 2 },
                    { charisma: 8, wisdom: 7 },
                    { charisma: 5, wisdom: 1 },
                ],
            })
            const { quest, idea } = await world.incarnateOneIdea()
            expect(quest.memberIds).toContain(idea.meberId)
            expect(quest.memberIds).toContain(world.members[3].id)
        })
        it('should pick only those who has no active quests', async () => {
            const world = await setUp({
                members: [
                    { charisma: 10, wisdom: 6 },
                    { charisma: 2, wisdom: 4 },
                    { charisma: 5, wisdom: 2 },
                    { charisma: 2, wisdom: 6 },
                ],
            })
            await world.addQuests(world.members[0].id)
            await world.addQuests(world.members[3].id, 2)
            const { quest } = await world.incarnateOneIdea()
            expect(quest.memberIds).toContain(world.members[1].id)
            expect(quest.memberIds).toContain(world.members[2].id)
        })
        it("won't assign quest to the same person twice", async () => {
            const world = await setUp({
                members: [
                    { charisma: 10, wisdom: 6 }, // we'll add them a quest to remove from assignment
                    { charisma: 20, wisdom: 20 }, // best shaman & best chief
                    { charisma: 5, wisdom: 2 },
                ],
            })
            await world.addQuests(world.members[0].id)
            const { quest } = await world.incarnateOneIdea()
            expect(quest.memberIds).toContain(world.members[1].id)
            expect(quest.memberIds).toContain(world.members[2].id)
        })
        it('should pick two even if evryone has active quests', async () => {
            const world = await setUp({
                members: [
                    { charisma: 3, wisdom: 4 },
                    { charisma: 2, wisdom: 4 },
                    { charisma: 5, wisdom: 2 },
                    { charisma: 2, wisdom: 6 },
                ],
            })
            await Promise.all(world.members.map((m) => world.addQuests(m.id)))
            const { quest } = await world.incarnateOneIdea()
            expect(quest.memberIds).toContain(world.members[0].id)
            expect(quest.memberIds).toContain(world.members[2].id)
        })
    })
    describe('Quest notification', () => {
        it('notifies both members on quest proposal', async () => {
            const world = await setUp()
            const spy = jasmine.createSpy('onQuest')
            world.notififcationBus.subscribe<QuestMessage>(
                'new-quest-message',
                spy
            )
            const { quest } = await world.incarnateOneIdea()
            const expectedMessage = jasmine.objectContaining<QuestMessage>({
                type: 'new-quest-message',
                payload: jasmine.objectContaining<QuestMessage['payload']>({
                    memberIds: jasmine.arrayWithExactContents(quest.memberIds),
                    questId: quest.id,
                    place: '',
                    type: quest.type,
                    time: quest.time,
                }),
            })
            expect(spy).toHaveBeenCalledTimes(2)
            expect(spy.calls.argsFor(0)[0]).toEqual(expectedMessage)
            expect(spy.calls.argsFor(1)[0]).toEqual(expectedMessage)
            const notifiedMembers = [
                spy.calls.argsFor(0)[0].payload.targetMemberId,
                spy.calls.argsFor(1)[0].payload.targetMemberId,
            ]
            expect(notifiedMembers).toEqual(
                jasmine.arrayWithExactContents(quest.memberIds)
            )
        })
    })
})
const defaultMembers = [
    { charisma: 10, wisdom: 6 }, // chief: 10 > 6
    { charisma: 12, wisdom: 7 }, // also chief: 12 > 6
    { charisma: 2, wisdom: 6 }, //  better shaman!
    { charisma: 2, wisdom: 5 }, //  shaman
    { charisma: 3, wisdom: 5 }, //  shaman
]
interface MemberFake {
    charisma: number
    wisdom: number
}
interface Settings {
    members?: MemberFake[]
    ideas?: number
}
async function setUp(settings: Settings = {}) {
    const context = await createContext()

    const makeTribe = makeTribeFactory(context.stores)
    const incarnation = new IdeasIncarnation(context)
    const { members, tribe } = await makeTribe(
        settings.members || defaultMembers
    )
    const brainstorm = await context.stores.brainstormStore.save(
        new Brainstorm({
            tribeId: tribe.id,
            time: Date.now() + 100_500_000,
        })
    )
    const rawIdeas = range(settings.ideas || 1).map(
        () =>
            new QuestIdea({
                brainstormId: brainstorm.id,
                description: 'let us FOOO!',
                meberId: members[0].id,
            })
    )
    const ideas = await context.stores.ideaStore.saveBulk(rawIdeas)
    const task = (await context.stores.taskStore.save({
        time: Date.now(),
        done: false,
        type: 'brainstorm-to-finalyze',
        payload: {
            brainstormId: brainstorm.id,
        },
    })) as StormFinalyze & Storable

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
        const quests = await context.stores.questStore.find({
            ideaId: idea.id,
        })
        return quests[0]
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
            return await context.stores.ideaStore.find({
                brainstormId: brainstorm.id,
            })
        },
        incarnateOneIdea: async () => {
            await vote(0, { up: members.length - 1, down: 0 })
            await incarnation.incarnateIdeas(task)
            return { quest: await getQuestByIdeaN(0), idea: getIdeaByN(0) }
        },
        addQuests: async (memberId: string, amount: number = 1) => {
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
    }
}

function makeTribeFactory({ memberStore, tribeStore }: Context['stores']) {
    return async function makeTribe(ms: MemberFake[]) {
        const tribe = await tribeStore.save(
            new Tribe({ name: 'Foo Tribe', cityId: 'city-42' })
        )
        const members = await memberStore.saveBulk(
            ms.map(
                (m, i) =>
                    new Member({
                        userId: `u-${i + 1}`,
                        tribeId: tribe.id,
                        charisma: m.charisma,
                        wisdom: m.wisdom,
                    })
            )
        )
        return { tribe, members }
    }
}

function range(n: number) {
    return new Array(n).fill(0).map((_, i) => i)
}
