import { QuestIdea } from '../entities/brainstorm'
import { Member, SavedMember } from '../entities/member'
import { QuestStatus, QuestType } from '../entities/quest'
import { IdeasIncarnation } from '../incarnate-ideas'
import { createContext } from './test-context'

describe('When brainstorm is over', () => {
    it('instantiates itself from storage', async () => {
        const world = await setUp()
        await world.incarnation.incarnateIdeas('foo')
        expect(world.brainstormStore.getById).toHaveBeenCalledWith('foo')
    })
    it('finds proper ideas and members', async () => {
        const world = await setUp()

        await world.incarnation.incarnateIdeas(world.brainstorm.id)
        expect(world.memberStore.find).toHaveBeenCalledWith({
            tribeId: world.brainstorm.tribeId,
        })
        expect(world.ideasStore.find).toHaveBeenCalledWith({
            brainstormId: world.brainstorm.id,
        })
    })

    describe('Ideas to quests incarnation', () => {
        it('incarnates quests with description of idea', async () => {
            const world = await setUp()
            const { idea, quest } = await world.incarnateOneIdea()
            expect(quest.description).toEqual(idea.description)
        })
        it('incarnates no more than half tribe count', async () => {
            const world = await setUp()
            const ideas = [1, 2, 3, 4, 5].map(makeIdea)
            ideas.forEach(vote(5))
            world.ideasStore.find.and.resolveTo(ideas)

            await world.incarnation.incarnateIdeas(world.brainstorm.id)
            const questsToSave = world.getQuestsToSave()
            expect(questsToSave.length).toBeLessThanOrEqual(3)
        })
        it('incarnates only most popular ideas (& score >= 2)', async () => {
            const world = await setUp()
            const ideas = [1, 2, 3, 4, 5, 6].map(makeIdea)
            vote(5, 1)(ideas[0]) // +4 yes
            vote(5, 4)(ideas[1]) // 1 no
            vote(5, 1)(ideas[2]) // +4 yes
            vote(5, 3)(ideas[3]) // +2 yes but sixth's score is more
            vote(0, 3)(ideas[4]) // -3 no
            vote(6, 3)(ideas[5]) // +3 yes
            world.ideasStore.find.and.resolveTo(ideas)

            await world.incarnation.incarnateIdeas(world.brainstorm.id)
            const questsToSave = world.getQuestsToSave()
            const firstIdea = questsToSave.find(
                (q) => q.description === ideas[0].description
            )
            const thirdIdea = questsToSave.find(
                (q) => q.description === ideas[2].description
            )
            const sixthIdea = questsToSave.find(
                (q) => q.description === ideas[5].description
            )
            expect(firstIdea).withContext('firstIdea').toBeTruthy()
            expect(thirdIdea).withContext('thirdIdea').toBeTruthy()
            expect(sixthIdea).withContext('sixthIdea').toBeTruthy()
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
            expect(quest.date).toBeGreaterThan(oneWeekAhead - 1000)
            expect(quest.date).toBeLessThan(oneWeekAhead + 1000)
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
            const world = await setUp()
            const idea = makeIdea('i-1')
            idea.voteDown('mv-1')
            idea.voteUp('mv-2')
            idea.voteUp('mv-3')
            idea.voteUp('mv-4')
            idea.voteUp('mv-5')
            idea.voteDown('mv-6')
            world.ideasStore.find.and.resolveTo([idea])
            await world.incarnation.incarnateIdeas(world.brainstorm.id)
            const quest = world.getQuestsToSave()[0]
            expect(quest.memberIds).not.toContain('mv-1')
            expect(quest.memberIds).not.toContain('mv-6')
        })
        it('should instantiate all affected members', async () => {
            const world = await setUp()
            const { idea } = await world.incarnateOneIdea()
            const upvoterIds = idea.votes.map((v) => v.memberId)
            const idsToFind = world.memberStore.find.calls.mostRecent().args[0]
                .id
            expect(idsToFind?.length).toEqual(idea.votes.length + 1)
            expect(idsToFind).toContain(idea.meberId)
            upvoterIds.forEach((id) => {
                expect(idsToFind).toContain(id)
            })
        })
        it('should pick shaman for chief (starter)', async () => {
            const world = await setUp()
            const { members } = world.makeSimpleTribe([
                { charisma: 10, wisdom: 6 }, // chief: 10 > 6
                { charisma: 12, wisdom: 7 }, // also chief: 12 > 6
                { charisma: 2, wisdom: 6 }, //  better shaman!
                { charisma: 2, wisdom: 5 }, //  shaman
            ])

            const { quest, idea } = await world.incarnateOneIdea()
            expect(quest.memberIds).toContain(idea.meberId)
            expect(quest.memberIds).toContain(members[2].id)
        })
        it('should pick chief for shaman', async () => {
            const world = await setUp()
            const { members } = world.makeSimpleTribe([
                { charisma: 2, wisdom: 5 }, // starter is shaman: 2 < 5
                { charisma: 6, wisdom: 4 }, // chief
                { charisma: 7, wisdom: 2 }, // better chief
                { charisma: 8, wisdom: 12 }, // awesome, but also shaman
            ])

            const { quest, idea } = await world.incarnateOneIdea()
            expect(quest.memberIds).toContain(idea.meberId)
            expect(quest.memberIds).toContain(members[2].id)
        })
        it('should pick wisest cheif if no shamans in tribe', async () => {
            const world = await setUp()
            const { members } = world.makeSimpleTribe([
                { charisma: 5, wisdom: 2 },
                { charisma: 6, wisdom: 4 },
                { charisma: 7, wisdom: 2 },
                { charisma: 8, wisdom: 7 },
            ])

            const { quest, idea } = await world.incarnateOneIdea()
            expect(quest.memberIds).toContain(idea.meberId)
            expect(quest.memberIds).toContain(members[3].id)
        })
        it('should pick only those who has no active quests', async () => {
            const world = await setUp()
            const { members } = world.makeSimpleTribe([
                { charisma: 10, wisdom: 6, quests: 1 },
                { charisma: 2, wisdom: 4 },
                { charisma: 5, wisdom: 2 },
                { charisma: 2, wisdom: 6, quests: 2 },
            ])

            const { quest } = await world.incarnateOneIdea()
            expect(quest.memberIds).toContain(members[1].id)
            expect(quest.memberIds).toContain(members[2].id)
        })
        it("won't assign quest to the same person twice", async () => {
            const world = await setUp()
            const { members } = world.makeSimpleTribe([
                { charisma: 10, wisdom: 6, quests: 1 },
                { charisma: 20, wisdom: 20 },
                { charisma: 5, wisdom: 2 },
            ])
            const { quest } = await world.incarnateOneIdea()
            expect(quest.memberIds).toContain(members[1].id)
            expect(quest.memberIds).toContain(members[2].id)
        })
        it('should pick two even if evryone has active quests', async () => {
            const world = await setUp()
            const { members } = world.makeSimpleTribe([
                { charisma: 3, wisdom: 4, quests: 3 },
                { charisma: 2, wisdom: 4, quests: 3 },
                { charisma: 5, wisdom: 2, quests: 3 },
                { charisma: 2, wisdom: 6, quests: 3 },
            ])
            const { quest } = await world.incarnateOneIdea()
            expect(quest.memberIds).toContain(members[0].id)
            expect(quest.memberIds).toContain(members[2].id)
        })
    })

    it('finalises containing ideas', async () => {
        const { incarnation, ideasStore } = await setUp()
        const ideas = [1, 2, 3].map(makeIdea)
        ideasStore.find.and.resolveTo(ideas)
        await incarnation.incarnateIdeas('foo')
        const ideasToSave = ideasStore.saveBulk.calls.argsFor(0)[0]
        expect(Array.isArray(ideasToSave)).toBe(true)
        Array.isArray(ideasToSave) &&
            ideasToSave.forEach((idea) => {
                expect(idea.state).toEqual('finished')
            })
    })

    it('finalises itself', async () => {
        const { incarnation, brainstormStore } = await setUp()
        await incarnation.incarnateIdeas('foo')
        const stormToSave = brainstormStore.save.calls.argsFor(0)[0]
        expect(stormToSave.state).toEqual('finished')
    })
})

async function setUp() {
    const context = createContext()
    const brainstorm = (await context.stores.brainstormStore.getById(
        'whatever'
    ))!

    const members = [0, 1, 2, 3, 4]
        .map(memId)
        .map(makeMember(brainstorm.tribeId))

    context.stores.memberStore.find.and.resolveTo(members)
    const incarnation = new IdeasIncarnation(context)
    const getQuestsToSave = (call: number = 0) => {
        const quests = context.stores.questStore.saveBulk.calls.argsFor(call)[0]
        if (!Array.isArray(quests)) {
            throw new Error('expected quest to save to be an array')
        }
        return quests
    }
    return {
        ...context.stores,
        brainstorm,
        incarnation,
        members,
        getQuestsToSave,
        incarnateOneIdea: async () => {
            const idea = makeIdea(1)
            vote(5)(idea)
            context.stores.ideasStore.find.and.resolveTo([idea])

            await incarnation.incarnateIdeas(brainstorm.id)
            return { quest: getQuestsToSave()[0], idea }
        },
        makeSimpleTribe(ms: MemberFake[]) {
            const members = ms.map(
                (m, i) =>
                    new Member({
                        id: memId(i),
                        userId: `u-${i + 1}`,
                        tribeId: brainstorm.tribeId,
                        charisma: m.charisma,
                        wisdom: m.wisdom,
                    }) as SavedMember
            )
            const quests = members.reduce(
                (qs, m, i) => ({ ...qs, [m.id]: ms[i].quests || 0 }),
                {}
            )
            context.stores.memberStore.find.and.resolveTo(members)
            context.stores.questStore.getActiveQuestsCount.and.resolveTo(quests)
            return { members, quests }
        },
    }
}
interface MemberFake {
    charisma: number
    wisdom: number
    quests?: number
}
function makeIdea(id: string | number) {
    return new QuestIdea({
        id: `${id}`,
        meberId: memId(),
        brainstormId: 'foo',
        description: `desc ${id}`,
    })
}
function memId(n = 0) {
    return `m-${n + 1}`
}

function vote(up = 0, down = 0) {
    return (idea: QuestIdea) => {
        range(up).forEach((m) => idea.voteUp(memId(10 + m)))
        range(down).forEach((m) => idea.voteDown(memId(10 + m)))
    }
}

function range(n: number) {
    return new Array(n).fill(0).map((_, i) => i)
}
function makeMember(tribeId: string) {
    return (id: string | number) =>
        new Member({ id: `${id}`, userId: `${id}`, tribeId }) as SavedMember
}
