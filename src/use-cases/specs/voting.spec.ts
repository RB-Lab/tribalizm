import {
    Brainstorm,
    BrainstormStore,
    DoubelVotingError,
    IdeasStore,
    QuestIdea,
    SelfVotingError,
    UpdateFinishedBrainstormError,
    UpdateFinishedIdeaError,
} from '../entities/brainstorm'
import { Member, MembersStore, SavedMember } from '../entities/member'
import { EntityNotFound } from '../entities/not-found-error'
import {
    ExternalMemberVoteError,
    StormMismatchError,
    Voting,
    VotingNotStartedError,
} from '../vote-idea'

describe('Voting', () => {
    it('should transition brainstorm to voting state', async () => {
        const world = setUp()
        await world.voting.start(world.brainstorm.id)
        expect(world.brainstormStore.getById).toHaveBeenCalledWith(
            world.brainstorm.id
        )
        const stormToSave = world.brainstormStore.save.calls.argsFor(0)[0]
        expect(stormToSave.state).toEqual('voting')
    })
    it('should start with stored voting-state storm', async () => {
        const world = setUp()
        world.brainstorm.toVoting()
        await world.voting.start(world.brainstorm.id)
        expect(world.brainstormStore.save).not.toHaveBeenCalled()
    })
    it('should fail if brainstorm not found', async () => {
        const world = setUp()
        world.brainstormStore.getById.and.resolveTo(null)
        await expectAsync(
            world.voting.start(world.brainstorm.id)
        ).toBeRejectedWithError(EntityNotFound)
    })
    it('should NOT allow voting for finished storm', async () => {
        const world = setUp()
        world.brainstormStore.getById.and.resolveTo(
            new Brainstorm(
                world.brainstorm.id,
                world.brainstorm.tribeId,
                'finished'
            )
        )
        await expectAsync(
            world.voting.start(world.brainstorm.id)
        ).toBeRejectedWithError(UpdateFinishedBrainstormError)
    })
    describe('for ideas', () => {
        it('should work with current idea', async () => {
            const world = setUp()
            await world.voting.start(world.brainstorm.id)
            await world.voting.voteUp(world.idea.id, world.member.id)
            expect(world.ideasStore.getById).toHaveBeenCalledWith(world.idea.id)
        })
        it('should store current idea', async () => {
            const world = setUp()
            await world.voting.start(world.brainstorm.id)
            await world.voting.voteUp(world.idea.id, world.member.id)
            expect(world.getIdeaToSave(0).id).toEqual(world.idea.id)
            await world.voting.voteDown(world.idea.id, world.member.id)
            expect(world.getIdeaToSave(1).id).toEqual(world.idea.id)
        })
        it('should vote idea up', async () => {
            const world = setUp()
            await world.voting.start(world.brainstorm.id)
            await world.voting.voteUp(world.idea.id, world.member.id)
            expect(world.getIdeaToSave().votes[0].vote).toEqual('up')
        })
        it('should vote idea down', async () => {
            const world = setUp()
            await world.voting.start(world.brainstorm.id)
            await world.voting.voteDown(world.idea.id, world.member.id)
            expect(world.getIdeaToSave().votes[0].vote).toEqual('down')
        })
        it('should work with correct memeber', async () => {
            const world = setUp()
            await world.voting.start(world.brainstorm.id)
            await world.voting.voteDown(world.idea.id, world.member.id)
            expect(world.memberStore.getById.calls.argsFor(0)).toEqual([
                world.member.id,
            ])
        })
        it('should save voting member', async () => {
            const world = setUp()
            await world.voting.start(world.brainstorm.id)
            await world.voting.voteUp(world.idea.id, world.member.id)
            expect(world.getIdeaToSave(0).votes[0].memberId).toEqual(
                world.member.id
            )
            await world.voting.voteDown(world.idea.id, 'm-43')
            expect(world.getIdeaToSave(1).votes[1].memberId).toEqual('m-43')
        })
    })
    describe('for ideas (failure)', () => {
        it('should NOT allow voting own idea', async () => {
            const world = setUp()
            await world.voting.start(world.brainstorm.id)
            await expectAsync(
                world.voting.voteUp(world.idea.id, world.idea.meberId)
            ).toBeRejectedWithError(SelfVotingError)
        })
        it('should NOT allow voting twice', async () => {
            const world = setUp()
            await world.voting.start(world.brainstorm.id)
            await world.voting.voteUp(world.idea.id, world.member.id)
            await expectAsync(
                world.voting.voteUp(world.idea.id, world.member.id)
            ).toBeRejectedWithError(DoubelVotingError)
        })
        it('should NOT allow voting for non-existing idea', async () => {
            const world = setUp()
            await world.voting.start(world.brainstorm.id)
            world.ideasStore.getById.and.resolveTo(null)
            await expectAsync(
                world.voting.voteUp('ololo', world.member.id)
            ).toBeRejectedWithError(EntityNotFound)
        })
        it('should NOT allow to vote before start', async () => {
            const world = setUp()
            await expectAsync(
                world.voting.voteDown(world.idea.id, world.member.id)
            ).toBeRejectedWithError(VotingNotStartedError)
        })
        it('should NOT allow voting for idea not from this storm', async () => {
            const world = setUp()
            world.brainstormStore.getById.and.resolveTo(
                new Brainstorm('not-foo', 't-42')
            )
            await world.voting.start(world.brainstorm.id)
            await expectAsync(
                world.voting.voteDown(world.idea.id, world.member.id)
            ).toBeRejectedWithError(StormMismatchError)
        })
        it('should NOT allow voting for finished ideas', async () => {
            const world = setUp()
            world.idea.finish()
            await world.voting.start(world.brainstorm.id)
            await expectAsync(
                world.voting.voteDown(world.idea.id, world.member.id)
            ).toBeRejectedWithError(UpdateFinishedIdeaError)
        })
        it('should NOT allow voting for non-existing persons', async () => {
            const world = setUp()
            await world.voting.start(world.brainstorm.id)
            world.memberStore.getById.and.resolveTo(null)
            await expectAsync(
                world.voting.voteDown(world.idea.id, 'ololo')
            ).toBeRejectedWithError(EntityNotFound)
        })
        it('should NOT allow voting for external persons', async () => {
            const world = setUp()
            const member = new Member({
                id: 'm-n42',
                userId: 'u',
                tribeId: 't-not-42',
            }) as SavedMember
            world.memberStore.getById.and.resolveTo(member)
            await world.voting.start(world.brainstorm.id)
            await expectAsync(
                world.voting.voteUp(world.idea.id, member.id)
            ).toBeRejectedWithError(ExternalMemberVoteError)
        })
    })
})

function setUp() {
    const brainstorm = new Brainstorm('foo', 't-42')
    const idea = new QuestIdea({
        id: `i-42`,
        meberId: 'm-1',
        brainstormId: 'foo',
        description: `desc i-42`,
    })
    const member = new Member({
        id: 'm-42',
        userId: 'u-42',
        tribeId: 't-42',
    }) as SavedMember

    const memberStore = jasmine.createSpyObj<MembersStore>('MemberStore', {
        find: Promise.resolve([]),
        getById: Promise.resolve(member),
    })

    const ideasStore = jasmine.createSpyObj<IdeasStore>('IdeasStore', {
        getById: Promise.resolve(idea),
        find: Promise.resolve([]),
        save: Promise.resolve([]),
    })
    const brainstormStore = jasmine.createSpyObj<BrainstormStore>(
        'BrainstormStore',
        {
            getById: Promise.resolve(brainstorm),
            save: Promise.resolve(brainstorm),
        }
    )
    const voting = new Voting(ideasStore, brainstormStore, memberStore)

    return {
        brainstorm,
        brainstormStore,
        ideasStore,
        memberStore,
        voting,
        idea,
        member,
        getIdeaToSave: (call: number = 0) => {
            const idea = ideasStore.save.calls.argsFor(call)[0]
            if (Array.isArray(idea)) {
                throw new Error('expected single idea to be saved')
            }
            return idea
        },
    }
}
