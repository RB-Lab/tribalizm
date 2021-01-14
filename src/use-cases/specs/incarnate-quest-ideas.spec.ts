import {
    Brainstorm,
    BrainstormStore,
    IdeasStore,
    QuestIdea,
} from '../entities/brainstorm'
import { Member, MemberStore } from '../entities/member'
import { IdeasIncarnation } from '../incarnate-ideas'

describe('When brainstorm over', () => {
    it('should work with specified brainstorm', async () => {
        const { incarnation, brainstormStore } = setUp()
        await incarnation.incarnateIdeas('foo')
        expect(brainstormStore.getById).toHaveBeenCalledOnceWith('foo')
    })

    describe('Popular quest ideas incarnate as quests', () => {
        xit('should pick no more quests than half members in tribe', async () => {
            const { ideasStore, memberStore } = setUp()
            const memebers = [1, 2, 3, 4].map(makeMember('foo-tribe'))
            memberStore.find.and.resolveTo(memebers)
            const ideas = [1, 2, 3].map(makeIdea)
            ideas[0].voteUp('1')
            ideasStore.find.and.resolveTo(ideas)
        })
        it('should pick N ideas with non-negative score')
    })
    describe('New quests must be assigned among tribe members', () => {
        it('must be figured out')
    })

    it('should finalise containing ideas', async () => {
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

    it('should finalise brainstrom', async () => {
        const { incarnation, brainstormStore } = setUp()
        await incarnation.incarnateIdeas('foo')
        const stormToSave = brainstormStore.save.calls.argsFor(0)[0]
        expect(stormToSave.state).toEqual('finished')
    })
})

function setUp() {
    const brainstorm = new Brainstorm('foo', 't-42')

    const memberStore = jasmine.createSpyObj<MemberStore>({
        find: Promise.resolve([]),
    })
    const ideasStore = jasmine.createSpyObj<IdeasStore>({
        find: Promise.resolve([]),
        save: Promise.resolve([]),
    })
    const brainstormStore = jasmine.createSpyObj<BrainstormStore>({
        getById: Promise.resolve(brainstorm),
        save: Promise.resolve(brainstorm),
    })
    const incarnation = new IdeasIncarnation(ideasStore, brainstormStore)
    return { brainstorm, brainstormStore, ideasStore, memberStore, incarnation }
}
function makeIdea(id: string | number) {
    return new QuestIdea({
        id: `${id}`,
        meberId: 'm-1',
        brainstormId: 'foo',
        description: `desc ${id}`,
    })
}

function makeMember(tribeId: string) {
    return (id: string | number) => new Member(`${id}`, `${id}`, tribeId)
}
