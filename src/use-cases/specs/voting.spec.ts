import {
    Brainstorm,
    BrainstromVote,
    DoubelVotingError,
    QuestIdea,
    SelfVotingError,
    UpdateFinishedBrainstormError,
    UpdateFinishedIdeaError,
} from '../entities/brainstorm'
import { Member } from '../entities/member'
import { EntityNotFound } from '../entities/not-found-error'
import { Tribe } from '../entities/tribe'
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
        expect(world.brainstorm.state).toEqual('generation')
        await world.voting.start(world.brainstorm.id)
        const savedStorm = await world.brainstormStore.getById(
            world.brainstorm.id
        )
        expect(savedStorm?.state).toEqual('voting')
    })
    it('should fail if brainstorm not found', async () => {
        const world = await setUp()
        await expectAsync(
            world.voting.start('not-existing')
        ).toBeRejectedWithError(EntityNotFound)
    })
    it('should NOT allow voting for finished storm', async () => {
        const world = await setUp()
        await world.brainstormStore.save(
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
    describe('for ideas', () => {
        it('should store current idea with votes', async () => {
            const world = await setUp()
            expectAsync(world.getIdea()).toBeResolvedTo(
                jasmine.objectContaining<QuestIdea>({
                    votes: [],
                })
            )
            await world.voting.start(world.brainstorm.id)
            await world.voting.voteUp(world.idea.id, world.votingMember.id)
            await expectAsync(world.getIdea()).toBeResolvedTo(
                jasmine.objectContaining<QuestIdea>({
                    votes: jasmine.arrayContaining([
                        jasmine.objectContaining<BrainstromVote>({
                            vote: 'up',
                            memberId: world.votingMember.id,
                        }),
                    ]),
                })
            )
            await world.voting.voteDown(world.idea.id, world.votingMember.id)
            await expectAsync(world.getIdea()).toBeResolvedTo(
                jasmine.objectContaining<QuestIdea>({
                    votes: jasmine.arrayContaining([
                        jasmine.objectContaining<BrainstromVote>({
                            vote: 'down',
                            memberId: world.votingMember.id,
                        }),
                    ]),
                })
            )
        })
        xit('should allow re-voting', async () => {
            fail('TODO')
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
            await world.voting.voteUp(world.idea.id, world.votingMember.id)
            await expectAsync(
                world.voting.voteUp(world.idea.id, world.votingMember.id)
            ).toBeRejectedWithError(DoubelVotingError)
        })
        it('should NOT allow voting for non-existing idea', async () => {
            const world = await setUp()
            await world.voting.start(world.brainstorm.id)
            await expectAsync(
                world.voting.voteUp('ololo', world.votingMember.id)
            ).toBeRejectedWithError(EntityNotFound)
        })
        it('should NOT allow to vote before start', async () => {
            const world = await setUp()
            await expectAsync(
                world.voting.voteDown(world.idea.id, world.votingMember.id)
            ).toBeRejectedWithError(VotingNotStartedError)
        })
        it('should NOT allow voting for idea not from this storm', async () => {
            const world = await setUp()
            const otherIdea = await world.ideasStore.save(
                new QuestIdea({
                    brainstormId: 'other-storm',
                    description: "this won't pass",
                    meberId: world.ideaMember.id,
                })
            )
            await world.voting.start(world.brainstorm.id)
            await expectAsync(
                world.voting.voteDown(otherIdea.id, world.votingMember.id)
            ).toBeRejectedWithError(StormMismatchError)
        })
        it('should NOT allow voting for finished ideas', async () => {
            const world = await setUp()
            world.idea.finish()
            await world.ideasStore.save(world.idea)
            await world.voting.start(world.brainstorm.id)
            await expectAsync(
                world.voting.voteDown(world.idea.id, world.votingMember.id)
            ).toBeRejectedWithError(UpdateFinishedIdeaError)
        })
        it('should NOT allow voting for non-existing persons', async () => {
            const world = await setUp()
            await world.voting.start(world.brainstorm.id)
            await expectAsync(
                world.voting.voteDown(world.idea.id, 'ololo')
            ).toBeRejectedWithError(EntityNotFound)
        })
        it('should NOT allow voting for external persons', async () => {
            const world = await setUp()
            const member = await world.memberStore.save(
                new Member({
                    userId: 'user-not',
                    tribeId: 't-not-42',
                })
            )
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

    const tribe = await context.stores.tribeStore.save(
        new Tribe({
            name: 'Foo tribe',
        })
    )
    const [
        ideaMember,
        votingMember,
    ] = await context.stores.memberStore.saveBulk([
        new Member({
            tribeId: tribe.id,
            userId: 'user',
        }),
        new Member({
            tribeId: tribe.id,
            userId: 'user-2',
        }),
    ])
    const brainstorm = await context.stores.brainstormStore.save(
        new Brainstorm({
            tribeId: tribe.id,
            state: 'generation',
        })
    )
    const idea = await context.stores.ideasStore.save(
        new QuestIdea({
            brainstormId: brainstorm.id,
            description: 'To FOO!',
            meberId: ideaMember.id,
        })
    )

    return {
        ...context.stores,
        voting,
        brainstorm,
        idea,
        tribe,
        ideaMember,
        votingMember,
        getIdea: async () => context.stores.ideasStore.getById(idea.id),
    }
}
