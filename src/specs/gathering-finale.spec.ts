import { Gathering, NotParticipated } from '../use-cases/entities/gathering'
import { GatheringVote, OutOfRange } from '../use-cases/entities/member'
import { Storable } from '../use-cases/entities/store'
import { GatheringFinale } from '../use-cases/gathering-finale'
import { IdeasIncarnation } from '../use-cases/incarnate-ideas'
import { QuestSource } from '../use-cases/quest-source'
import { StormFinalyze } from '../use-cases/utils/scheduler'
import { createContext } from './test-context'

describe('Gathering finale', () => {
    it('marks member as done', async () => {
        const world = await setUp()
        await world.gatheringFinale.finalize(world.defautlRequest)
        const gathering = await world.gatheringStore.getById(world.gathering.id)
        expect(gathering!.done.length).toEqual(1)
        expect(gathering!.done[0]).toEqual(world.defautlRequest.memberId)
    })
    it('FAILs to vote from non-participant', async () => {
        const world = await setUp()
        await expectAsync(
            world.gatheringFinale.finalize({
                ...world.defautlRequest,
                memberId: 'not-a-member',
            })
        ).toBeRejectedWithError(NotParticipated)

        await expectAsync(
            world.gatheringFinale.finalize({
                ...world.defautlRequest,
                memberId: world.members[3].id,
            })
        ).toBeRejectedWithError(NotParticipated)
    })
    it('FAILs to cast less than 0', async () => {
        const world = await setUp()
        await expectAsync(
            world.gatheringFinale.finalize({
                ...world.defautlRequest,
                score: -4,
            })
        ).toBeRejectedWithError(OutOfRange)
    })
    it('FAILs to cast more than 4', async () => {
        const world = await setUp()
        await expectAsync(
            world.gatheringFinale.finalize({
                ...world.defautlRequest,
                score: 14,
            })
        ).toBeRejectedWithError(OutOfRange)
    })
    describe('score casting', () => {
        it('affects all involved in gathering coordination', async () => {
            const world = await setUp()
            await world.gatheringFinale.finalize(world.defautlRequest)
            const affectedMembers = await world.memberStore.find({
                id: world.affectedMembers,
            })
            expect(affectedMembers.length).toBeGreaterThan(0)
            affectedMembers.forEach((m) => {
                expect(m.votes.length)
                    .withContext(`member ${m.id} votes`)
                    .toBeGreaterThan(0)
                expect(m.charisma)
                    .withContext(`member ${m.id} charisma`)
                    .toBeGreaterThan(0)
                expect(m.wisdom)
                    .withContext(`member ${m.id} wisdom`)
                    .toBeGreaterThan(0)
            })
        })
        it('does NOT affect voting member', async () => {
            const world = await setUp()
            await world.gatheringFinale.finalize(world.defautlRequest)
            const votingMember = await world.memberStore.getById(
                world.defautlRequest.memberId
            )
            expect(votingMember!.votes.length).toEqual(0)
        })
        it('stores vote', async () => {
            const world = await setUp()
            await world.gatheringFinale.finalize(world.defautlRequest)
            const member = await world.memberStore.getById(world.members[0].id)

            expect(member!.votes[0]).toEqual(
                jasmine.objectContaining<GatheringVote>({
                    gatheringId: world.defautlRequest.gatheringId,
                    memberId: world.defautlRequest.memberId,
                })
            )
        })
        it('applies half-mean of all scores for this gathering', async () => {
            const world = await setUp()
            await world.gatheringFinale.finalize({
                gatheringId: world.gathering.id,
                memberId: world.members[2].id,
                score: 4,
            })
            await world.gatheringFinale.finalize({
                gatheringId: world.gathering.id,
                memberId: world.members[5].id,
                score: 2,
            })
            const member = await world.memberStore.getById(world.members[0].id)
            expect(member!.charisma).toEqual(1.5)
            expect(member!.wisdom).toEqual(1.5)
        })
    })
})
async function setUp() {
    const context = createContext()
    const { members, tribe, idea } = await context.testing.makeIdea(
        [2, 5, 6, 9, 7],
        [1, 3, 10],
        [4, 8]
    )
    const incarnation = new IdeasIncarnation(context)
    const task = (await context.stores.taskStore.save({
        time: Date.now(),
        done: false,
        type: 'brainstorm-to-finalyze',
        payload: {
            brainstormId: idea.brainstormId,
        },
    })) as StormFinalyze & Storable
    await incarnation.incarnateIdeas(task)
    const quest0 = (await context.stores.questStore.find({}))[0]
    const source = new QuestSource(context)
    const quest1 = await source.spawnQuest({
        description: 'spawn 1',
        memberId: quest0.memberIds[0],
        parentQuestId: quest0.id,
    })
    const quest2 = await source.spawnQuest({
        description: 'spawn 2',
        memberId: quest1.memberIds[0],
        parentQuestId: quest1.id,
    })

    const gathering = await context.stores.gatheringStore.save(
        new Gathering({
            description: 'lets OLOLO together!',
            place: 'the Foo Bar',
            time: 100_500_200_500,
            tribeId: tribe.id,
            type: 'all',
            parentQuestId: quest2.id,
            accepted: [members[0].id, members[2].id, members[5].id],
            declined: [members[1].id, members[3].id],
        })
    )
    const defautlRequest = {
        memberId: members[2].id,
        gatheringId: gathering.id,
        score: 4,
    }
    const affectedMembers = Array.from(
        new Set([...quest0.memberIds, ...quest1.memberIds, ...quest2.memberIds])
    ).filter((id) => id !== defautlRequest.memberId)

    const gatheringFinale = new GatheringFinale(context)
    return {
        ...context.stores,
        affectedMembers,
        members,
        gathering,
        gatheringFinale,
        defautlRequest,
    }
}
