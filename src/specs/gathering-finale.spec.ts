import { mapify } from '../ts-utils'
import { Gathering, NotParticipated } from '../use-cases/entities/gathering'
import { GatheringVote, VoteRangeError } from '../use-cases/entities/member'
import { Storable } from '../use-cases/entities/store'
import {
    GatheringFinale,
    HowWasGatheringMessage,
} from '../use-cases/gathering-finale'
import { IdeasIncarnation } from '../use-cases/incarnate-ideas'
import { SpawnQuest } from '../use-cases/spawn-quest'
import {
    isHowWasGatheringTask,
    StormFinalize,
} from '../use-cases/utils/scheduler'
import { createContext } from './test-context'

describe('Gathering finale', () => {
    it('notifies all accepted members', async () => {
        const world = await setUp()
        const onHowWasIt = world.spyOnMessage<HowWasGatheringMessage>(
            'how-was-gathering-message'
        )
        const notifyTask = await world.taskStore._last()
        if (!isHowWasGatheringTask(notifyTask)) {
            throw new Error('Task retrieved is not HowWasGatheringTask')
        }
        await world.gatheringFinale.notifyMembers(notifyTask)
        expect(onHowWasIt).toHaveBeenCalledTimes(
            world.gathering.accepted.length
        )
        expect(onHowWasIt).toHaveBeenCalledWith({
            type: 'how-was-gathering-message',
            payload: jasmine.objectContaining({
                gatheringId: world.gathering.id,
                gatheringName: world.gathering.description,
            }),
        })
        const memberMap = mapify(world.members)
        for (let call of onHowWasIt.calls.all()) {
            const memberId = call.args[0].payload.targetMemberId
            expect(world.gathering.accepted).toContain(memberId)
            expect(memberMap[memberId].userId).toBe(
                call.args[0].payload.targetUserId
            )
        }
    })
    it('marks member as done', async () => {
        const world = await setUp()
        await world.gatheringFinale.finalize(world.defautlRequest)
        const gathering = await world.gatheringStore.getById(world.gathering.id)
        expect(gathering!.done.length).toEqual(1)
        expect(gathering!.done[0]).toEqual(world.defautlRequest.memberId)
    })
    it('FAILs to vote from not-a-member', async () => {
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
        ).toBeRejectedWithError(VoteRangeError)
    })
    it('FAILs to cast more than 4', async () => {
        const world = await setUp()
        await expectAsync(
            world.gatheringFinale.finalize({
                ...world.defautlRequest,
                score: 14,
            })
        ).toBeRejectedWithError(VoteRangeError)
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
            const member = await world.memberStore.getById(world.members[2].id)

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
                memberId: world.members[6].id,
                score: 4,
            })
            await world.gatheringFinale.finalize({
                gatheringId: world.gathering.id,
                memberId: world.members[5].id,
                score: 2,
            })
            const member = await world.memberStore.getById(world.members[2].id)
            expect(member!.charisma).toEqual(1.5)
            expect(member!.wisdom).toEqual(1.5)
        })
    })

    it('makes a new most charismatic member chief', async () => {
        const world = await setUp()
        const chief = await world.memberStore.getById(world.tribe.chiefId!)
        const gathering1 = world.gathering
        const gathering2 = await world.makeGathering()
        await world.gatheringFinale.finalize({
            gatheringId: gathering1.id,
            memberId: world.members[5].id,
            score: 3,
        })
        await world.gatheringFinale.finalize({
            gatheringId: gathering2.id,
            memberId: world.members[6].id,
            score: 4,
        })
        const members = await world.memberStore.find({
            tribeId: world.tribe.id,
        })
        const newLeaders = members.filter((m) => m.charisma > chief!.charisma)
        expect(newLeaders.length).toBeGreaterThan(0)
        const tribe = await world.tribeStore.getById(world.tribe.id)
        expect(newLeaders.map((m) => m.id)).toContain(tribe!.chiefId!)
    })
    it('makes a new most wise member shaman', async () => {
        const world = await setUp()
        const shaman = await world.memberStore.getById(world.tribe.shamanId!)
        const gathering1 = world.gathering
        const gathering2 = await world.makeGathering()
        await world.gatheringFinale.finalize({
            gatheringId: gathering1.id,
            memberId: world.members[5].id,
            score: 3,
        })
        await world.gatheringFinale.finalize({
            gatheringId: gathering2.id,
            memberId: world.members[6].id,
            score: 4,
        })
        const members = await world.memberStore.find({
            tribeId: world.tribe.id,
        })
        const newLeaders = members.filter((m) => m.wisdom > shaman!.wisdom)
        expect(newLeaders.length).toBeGreaterThan(0)
        const tribe = await world.tribeStore.getById(world.tribe.id)
        expect(newLeaders.map((m) => m.id)).toContain(tribe!.shamanId!)
    })
})
async function setUp() {
    const context = await createContext()
    const { members, tribe, idea } = await context.testing.makeIdea(
        [5, 6, 9, 7, 8, 10],
        [0, 1, 3],
        [2, 4],
        2
    )
    const incarnation = new IdeasIncarnation(context)
    const task = (await context.stores.taskStore.save({
        time: Date.now(),
        done: false,
        type: 'brainstorm-to-finalize',
        payload: {
            brainstormId: idea.brainstormId,
        },
    })) as StormFinalize & Storable
    await incarnation.incarnateIdeas(task)
    const quest0 = await context.stores.questStore._last()
    const source = new SpawnQuest(context)
    const quest1 = await source.spawnQuest({
        description: 'spawn 1',
        memberId: quest0!.memberIds[0],
        parentQuestId: quest0!.id,
    })
    const quest2 = await source.spawnQuest({
        description: 'spawn 2',
        memberId: quest1.memberIds[0],
        parentQuestId: quest1.id,
    })

    const gathering = await makeGathering()
    const defautlRequest = {
        memberId: members[6].id,
        gatheringId: gathering.id,
        score: 4,
    }
    const affectedMembers = Array.from(
        new Set([
            ...quest0!.memberIds,
            ...quest1.memberIds,
            ...quest2.memberIds,
        ])
    ).filter((id) => id !== defautlRequest.memberId)

    const gatheringFinale = new GatheringFinale(context)

    async function makeGathering() {
        await context.tribalism.gatheringDeclare.declare({
            description: 'lets OLOLO together!',
            place: 'the Foo Bar',
            time: 100500200500,
            memberId: quest2.memberIds[0],
            parentQuestId: quest2.id,
            type: 'all',
        })
        const gathering = await context.stores.gatheringStore._last()
        const accepted = [5, 6, 9, 2]
        const declined = [10, 7]
        for (let m of members) {
            if (accepted.includes(members.indexOf(m))) {
                await context.tribalism.gatheringAcknowledge.accept({
                    gatheringId: gathering.id,
                    memberId: m.id,
                })
            }
            if (declined.includes(members.indexOf(m))) {
                await context.tribalism.gatheringAcknowledge.decline({
                    gatheringId: gathering.id,
                    memberId: m.id,
                })
            }
        }
        return await context.stores.gatheringStore._last()
    }
    return {
        ...context.stores,
        ...context.testing,
        affectedMembers,
        members,
        tribe,
        gathering,
        makeGathering,
        gatheringFinale,
        defautlRequest,
        spyOnMessage: context.testing.spyOnMessage,
    }
}
