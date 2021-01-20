import {
    Brainstorm,
    BrainstormStore,
    IdeasStore,
    QuestIdea,
} from '../entities/brainstorm'
import { Member, MembersStore } from '../entities/member'
import { QuestsStore, QuestStatus, QuestType } from '../entities/quest'
import { IdeasIncarnation } from '../incarnate-ideas'

describe('When brainstorm is over', () => {
    it('instantiates itself from storage', async () => {
        const world = setUp()
        await world.incarnation.incarnateIdeas('foo')
        expect(world.brainstormStore.getById).toHaveBeenCalledOnceWith('foo')
    })
    it('finds proper ideas and members', async () => {
        const world = setUp()

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
            const world = setUp()
            const { idea, quest } = await world.incarnateOneIdea()
            expect(quest.description).toEqual(idea.description)
        })
        it('incarnates no more than half tribe count', async () => {
            const world = setUp()
            const ideas = [1, 2, 3, 4, 5].map(makeIdea)
            ideas.forEach(vote(5))
            world.ideasStore.find.and.resolveTo(ideas)

            await world.incarnation.incarnateIdeas(world.brainstorm.id)
            const questsToSave = world.getQuestsToSave()
            expect(questsToSave.length).toBeLessThanOrEqual(3)
        })
        it('incarnates only most popular ideas (& score >= 2)', async () => {
            const world = setUp()
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
            const world = setUp()
            const { quest } = await world.incarnateOneIdea()
            expect(quest.type).toEqual(QuestType.coordination)
        })
        it('incarnates as "proposed" quest', async () => {
            const world = setUp()
            const { quest } = await world.incarnateOneIdea()
            expect(quest.status).toEqual(QuestStatus.proposed)
        })
        it('proposes quest one week ahead', async () => {
            const world = setUp()
            const { quest } = await world.incarnateOneIdea()
            const oneWeekAhead = Date.now() + 7 * 24 * 3_600_000
            expect(quest.date.getTime()).toBeGreaterThan(oneWeekAhead - 1000)
            expect(quest.date.getTime()).toBeLessThan(oneWeekAhead + 1000)
        })
    })
    describe('Quests assignment', () => {
        it('assigns quest to two members', async () => {
            const world = setUp()
            const { quest } = await world.incarnateOneIdea()
            expect(quest.memberIds.length).toEqual(2)
        })
        it('assigns it to idea starter', async () => {
            const world = setUp()
            const { quest, idea } = await world.incarnateOneIdea()
            expect(quest.memberIds).toContain(idea.meberId)
        })
        it('should pick only upvoters', async () => {
            const world = setUp()
            const idea = makeIdea('i-1')
            idea.voteDown('mv-1')
            idea.voteUp('mv-')
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
        xit('should instantiate upvoters', async () => {
            const world = setUp()
            const { idea } = await world.incarnateOneIdea()
            const upvoterIds = idea.votes.map((v) => v.memberId)
            expect(world.memberStore.find).toHaveBeenCalledWith({
                id: upvoterIds,
            })
        })
        xit('should pick shaman for cheif', async () => {
            const world = setUp()
            const starter = new Member('m-1', 'u-1', 't-42', 10, 6)
            const shaman = new Member('m-2', 'u-2', 't-42', 2, 4)
            const otherCheif = new Member('m-3', 'u-3', 't-42', 5, 2)
            const betterShaman = new Member('m-4', 'u-4', 't-42', 2, 6)
            world.memberStore.find.and.resolveTo([
                starter,
                shaman,
                otherCheif,
                betterShaman,
            ])
        })
        it('should pick cheif for shaman')
        it('should pick only those who has no active quests')
        it('should pick two even if evryone has active quests')
    })

    it('finalises containing ideas', async () => {
        const { incarnation, ideasStore } = setUp()
        const ideas = [1, 2, 3].map(makeIdea)
        ideasStore.find.and.resolveTo(ideas)
        await incarnation.incarnateIdeas('foo')
        const ideasToSave = ideasStore.save.calls.argsFor(0)[0]
        expect(Array.isArray(ideasToSave)).toBe(true)
        Array.isArray(ideasToSave) &&
            ideasToSave.forEach((idea) => {
                expect(idea.state).toEqual('finished')
            })
    })

    it('finalises itself', async () => {
        const { incarnation, brainstormStore } = setUp()
        await incarnation.incarnateIdeas('foo')
        const stormToSave = brainstormStore.save.calls.argsFor(0)[0]
        expect(stormToSave.state).toEqual('finished')
    })
})

function setUp() {
    const brainstorm = new Brainstorm('foo', 't-42')

    const members = ['m-1', 'm-2', 'm-3', 'm-4', 'm-5'].map(
        makeMember(brainstorm.tribeId)
    )
    const memberStore = jasmine.createSpyObj<MembersStore>('MembersStore', {
        find: Promise.resolve(members),
    })
    const ideasStore = jasmine.createSpyObj<IdeasStore>('IdeasStore', {
        find: Promise.resolve([]),
        save: Promise.resolve([]),
    })
    const questStore = jasmine.createSpyObj<QuestsStore>('QuestsStore', {
        save: Promise.resolve([]),
    })
    const brainstormStore = jasmine.createSpyObj<BrainstormStore>(
        'BrainstormStore',
        {
            getById: Promise.resolve(brainstorm),
            save: Promise.resolve(brainstorm),
        }
    )
    const incarnation = new IdeasIncarnation(
        ideasStore,
        brainstormStore,
        memberStore,
        questStore
    )
    const getQuestsToSave = (call: number = 0) => {
        const quests = questStore.save.calls.argsFor(call)[0]
        if (!Array.isArray(quests)) {
            throw new Error('expected quest to save to be an array')
        }
        return quests
    }
    return {
        brainstorm,
        brainstormStore,
        ideasStore,
        memberStore,
        incarnation,
        questStore,
        members,
        getQuestsToSave,
        incarnateOneIdea: async () => {
            const idea = makeIdea(1)
            vote(5)(idea)
            ideasStore.find.and.resolveTo([idea])

            await incarnation.incarnateIdeas(brainstorm.id)
            return { quest: getQuestsToSave()[0], idea }
        },
    }
}
function makeIdea(id: string | number) {
    return new QuestIdea({
        id: `${id}`,
        meberId: 'm-1',
        brainstormId: 'foo',
        description: `desc ${id}`,
    })
}

function vote(up = 0, down = 0) {
    return (idea: QuestIdea) => {
        range(up).forEach((m) => idea.voteUp(`mx-${m}`))
        range(down).forEach((m) => idea.voteDown(`mx-${m}`))
    }
}

function range(n: number) {
    return new Array(n).fill(0).map((_, i) => i)
}
function makeMember(tribeId: string) {
    return (id: string | number) => new Member(`${id}`, `${id}`, tribeId)
}
