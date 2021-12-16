import { AddIdea } from '../use-cases/add-idea'
import { BrainstormLifecycle } from '../use-cases/brainstorm-lifecycle'
import {
    BrainstormVote,
    DoubleVotingError,
    QuestIdea,
    SelfVotingIdeaError,
} from '../use-cases/entities/brainstorm'
import { Member } from '../use-cases/entities/member'
import { Storable } from '../use-cases/entities/store'
import { EntityNotFound } from '../use-cases/utils/not-found-error'
import { StormToVoting } from '../use-cases/utils/scheduler'
import {
    BrainstormEndedError,
    ExternalMemberVoteError,
    Voting,
    VotingNotStartedError,
} from '../use-cases/vote-idea'
import { createContext } from './test-context'

describe('Voting', () => {
    // FLICK
    it('should store current idea with votes', async () => {
        const world = await setUp()
        expectAsync(world.getIdea()).toBeResolvedTo(
            jasmine.objectContaining<QuestIdea>({
                votes: [],
            })
        )
        await world.stormCycle.toVoting(world.toVoteTask)
        await world.voting.voteUp(world.idea.id, world.votingMember.userId)
        await expectAsync(world.getIdea()).toBeResolvedTo(
            jasmine.objectContaining<QuestIdea>({
                votes: jasmine.arrayContaining([
                    jasmine.objectContaining<BrainstormVote>({
                        vote: 'up',
                        memberId: world.votingMember.id,
                    }),
                ]),
            })
        )
        await world.voting.voteDown(world.idea.id, world.votingMember.userId)
        await expectAsync(world.getIdea()).toBeResolvedTo(
            jasmine.objectContaining<QuestIdea>({
                votes: jasmine.arrayContaining([
                    jasmine.objectContaining<BrainstormVote>({
                        vote: 'down',
                        memberId: world.votingMember.id,
                    }),
                ]),
            })
        )
    })
    it('should allow re-voting', async () => {
        const world = await setUp()
        await world.stormCycle.toVoting(world.toVoteTask)
        await world.voting.voteUp(world.idea.id, world.votingMember.userId)
        await world.voting.voteDown(world.idea.id, world.votingMember.userId)
        const idea = await world.getIdea()
        expect(idea?.votes.length).toEqual(1)
        expect(idea?.getScore()).toEqual(-1)
    })
    it('FAILs to vote own idea', async () => {
        const world = await setUp()
        await world.stormCycle.toVoting(world.toVoteTask)
        await expectAsync(
            world.voting.voteUp(world.idea.id, world.ideaMember.userId)
        ).toBeRejectedWithError(SelfVotingIdeaError)
    })
    it('FAILs to vote twice', async () => {
        const world = await setUp()
        await world.stormCycle.toVoting(world.toVoteTask)
        await world.voting.voteUp(world.idea.id, world.votingMember.userId)
        await expectAsync(
            world.voting.voteUp(world.idea.id, world.votingMember.userId)
        ).toBeRejectedWithError(DoubleVotingError)
    })
    it('FAILs to vote for non-existing idea', async () => {
        const world = await setUp()
        await world.stormCycle.toVoting(world.toVoteTask)
        await expectAsync(
            world.voting.voteUp('ololo', world.votingMember.userId)
        ).toBeRejectedWithError(EntityNotFound)
    })
    it('FAILs to vote before storm started', async () => {
        const world = await setUp()
        await expectAsync(
            world.voting.voteDown(world.idea.id, world.votingMember.userId)
        ).toBeRejectedWithError(VotingNotStartedError)
    })

    it('FAILs to vote in a finished storm', async () => {
        const world = await setUp()

        await world.stormCycle.toVoting(world.toVoteTask)
        const endTask = await world.taskStore._last()
        await world.stormCycle.finalize(endTask as any)

        await expectAsync(
            world.voting.voteUp(world.idea.id, world.votingMember.userId)
        ).toBeRejectedWithError(BrainstormEndedError)
    })
    it('FAILs to vote for non-existing persons', async () => {
        const world = await setUp()
        await world.stormCycle.toVoting(world.toVoteTask)
        await expectAsync(
            world.voting.voteDown(world.idea.id, 'ololo')
        ).toBeRejectedWithError(EntityNotFound)
    })
    it('FAILs to vote for external persons', async () => {
        const world = await setUp()
        const member = await world.memberStore.save(
            new Member({
                userId: 'user-not',
                tribeId: 't-not-42',
            })
        )
        await world.stormCycle.toVoting(world.toVoteTask)
        await expectAsync(
            world.voting.voteUp(world.idea.id, member.id)
        ).toBeRejected()
    })
})

async function setUp() {
    const context = await createContext()
    const voting = new Voting(context)

    const { tribe, members } = await context.testing.makeTribe()

    const stormCycle = new BrainstormLifecycle(context)
    await stormCycle.declare({
        memberId: tribe.chiefId!,
        time: Date.now() + 100_500_000,
    })
    let brainstorm = await context.stores.brainstormStore._last()
    const tasks = await context.stores.taskStore.find({
        type: 'start-brainstorm',
    })
    await stormCycle.startStorm(tasks[0] as any)
    const toVoteTask = await context.stores.taskStore._last()
    const ideasAdder = new AddIdea(context)
    await ideasAdder.addIdea({
        brainstormId: brainstorm.id,
        description: "let's FOO!",
        memberId: members[3].id,
    })
    const idea = await context.stores.ideaStore._last()

    // after all updates
    brainstorm = await context.stores.brainstormStore._last()

    return {
        ...context.stores,
        stormCycle: stormCycle,
        voting,
        toVoteTask: toVoteTask as StormToVoting & Storable,
        brainstorm,
        idea,
        tribe,
        ideaMember: members[3],
        votingMember: members[2],
        getIdea: async () => await context.stores.ideaStore.getById(idea.id),
    }
}
