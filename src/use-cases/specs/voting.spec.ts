import {
    Brainstorm,
    DoubelVotingError,
    SelfVotingError,
    UpdateFinishedBrainstormError,
    UpdateFinishedIdeaError,
} from '../entities/brainstorm'
import { Member, SavedMember } from '../entities/member'
import { EntityNotFound } from '../entities/not-found-error'
import {
    ExternalMemberVoteError,
    StormMismatchError,
    Voting,
    VotingNotStartedError,
} from '../vote-idea'
import { createContext } from './test-context'

describe('Voting', () => {
    it('should transition brainstorm to voting state', async () => {
        const world = await setUp()
        await world.voting.start(world.brainstorm.id)
        expect(world.brainstormStore.getById).toHaveBeenCalledWith(
            world.brainstorm.id
        )
        const stormToSave = world.brainstormStore.save.calls.argsFor(0)[0]
        expect(stormToSave.state).toEqual('voting')
    })
    it('should start with stored voting-state storm', async () => {
        const world = await setUp()
        world.brainstorm.toVoting()
        await world.voting.start(world.brainstorm.id)
        expect(world.brainstormStore.save).not.toHaveBeenCalled()
    })
    it('should fail if brainstorm not found', async () => {
        const world = await setUp()
        world.brainstormStore.getById.and.resolveTo(null)
        await expectAsync(
            world.voting.start(world.brainstorm.id)
        ).toBeRejectedWithError(EntityNotFound)
    })
    it('should NOT allow voting for finished storm', async () => {
        const world = await setUp()
        world.brainstormStore.getById.and.resolveTo(
            new Brainstorm({
                id: world.brainstorm.id,
                tribeId: world.brainstorm.tribeId,
                state: 'finished',
            })
        )
        await expectAsync(
            world.voting.start(world.brainstorm.id)
        ).toBeRejectedWithError(UpdateFinishedBrainstormError)
    })
    const votingMemberId = 'm-42'
    describe('for ideas', () => {
        it('should work with current idea', async () => {
            const world = await setUp()
            await world.voting.start(world.brainstorm.id)
            await world.voting.voteUp(world.idea.id, votingMemberId)
            expect(world.ideasStore.getById).toHaveBeenCalledWith(world.idea.id)
        })
        it('should store current idea', async () => {
            const world = await setUp()
            await world.voting.start(world.brainstorm.id)
            await world.voting.voteUp(world.idea.id, votingMemberId)
            expect(world.getIdeaToSave(0).id).toEqual(world.idea.id)
            await world.voting.voteDown(world.idea.id, votingMemberId)
            expect(world.getIdeaToSave(1).id).toEqual(world.idea.id)
        })
        it('should vote idea up', async () => {
            const world = await setUp()
            await world.voting.start(world.brainstorm.id)
            await world.voting.voteUp(world.idea.id, votingMemberId)
            expect(world.getIdeaToSave().votes[0].vote).toEqual('up')
        })
        it('should vote idea down', async () => {
            const world = await setUp()
            await world.voting.start(world.brainstorm.id)
            await world.voting.voteDown(world.idea.id, votingMemberId)
            expect(world.getIdeaToSave().votes[0].vote).toEqual('down')
        })
        it('should work with correct memeber', async () => {
            const world = await setUp()
            await world.voting.start(world.brainstorm.id)
            await world.voting.voteDown(world.idea.id, votingMemberId)
            expect(world.memberStore.getById).toHaveBeenCalledWith(
                votingMemberId
            )
        })
        it('should save voting member', async () => {
            const world = await setUp()
            await world.voting.start(world.brainstorm.id)
            await world.voting.voteUp(world.idea.id, votingMemberId)
            expect(world.getIdeaToSave(0).votes[0].memberId).toEqual(
                votingMemberId
            )

            const votingMember2 = 'm-43'
            await world.voting.voteDown(world.idea.id, votingMember2)
            expect(world.getIdeaToSave(1).votes[1].memberId).toEqual(
                votingMember2
            )
        })
    })
    describe('for ideas (failure)', () => {
        it('should NOT allow voting own idea', async () => {
            const world = await setUp()
            await world.voting.start(world.brainstorm.id)
            await expectAsync(
                world.voting.voteUp(world.idea.id, world.idea.meberId)
            ).toBeRejectedWithError(SelfVotingError)
        })
        it('should NOT allow voting twice', async () => {
            const world = await setUp()
            await world.voting.start(world.brainstorm.id)
            await world.voting.voteUp(world.idea.id, votingMemberId)
            await expectAsync(
                world.voting.voteUp(world.idea.id, votingMemberId)
            ).toBeRejectedWithError(DoubelVotingError)
        })
        it('should NOT allow voting for non-existing idea', async () => {
            const world = await setUp()
            await world.voting.start(world.brainstorm.id)
            world.ideasStore.getById.and.resolveTo(null)
            await expectAsync(
                world.voting.voteUp('ololo', votingMemberId)
            ).toBeRejectedWithError(EntityNotFound)
        })
        it('should NOT allow to vote before start', async () => {
            const world = await setUp()
            await expectAsync(
                world.voting.voteDown(world.idea.id, votingMemberId)
            ).toBeRejectedWithError(VotingNotStartedError)
        })
        it('should NOT allow voting for idea not from this storm', async () => {
            const world = await setUp()
            world.brainstormStore.getById.and.resolveTo(
                new Brainstorm({ id: 'not-foo', tribeId: world.tribe.id })
            )
            await world.voting.start(world.brainstorm.id)
            await expectAsync(
                world.voting.voteDown(world.idea.id, votingMemberId)
            ).toBeRejectedWithError(StormMismatchError)
        })
        it('should NOT allow voting for finished ideas', async () => {
            const world = await setUp()
            world.idea.finish()
            await world.voting.start(world.brainstorm.id)
            await expectAsync(
                world.voting.voteDown(world.idea.id, votingMemberId)
            ).toBeRejectedWithError(UpdateFinishedIdeaError)
        })
        it('should NOT allow voting for non-existing persons', async () => {
            const world = await setUp()
            await world.voting.start(world.brainstorm.id)
            world.memberStore.getById.and.resolveTo(null)
            await expectAsync(
                world.voting.voteDown(world.idea.id, 'ololo')
            ).toBeRejectedWithError(EntityNotFound)
        })
        it('should NOT allow voting for external persons', async () => {
            const world = await setUp()
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

async function setUp() {
    const context = createContext()
    const voting = new Voting(context)

    const brainstorm = (await context.stores.brainstormStore.getById(
        'whatever'
    ))!
    const idea = (await context.stores.ideasStore.getById('whatever'))!
    const member = (await context.stores.memberStore.getById('whatever'))!
    const tribe = (await context.stores.tribeStore.getById('whatever'))!

    return {
        ...context.stores,
        voting,
        brainstorm,
        idea,
        tribe,
        member,
        getIdeaToSave: (call: number = 0) => {
            const idea = context.stores.ideasStore.save.calls.argsFor(call)[0]
            if (Array.isArray(idea)) {
                throw new Error('expected single idea to be saved')
            }
            return idea
        },
    }
}
