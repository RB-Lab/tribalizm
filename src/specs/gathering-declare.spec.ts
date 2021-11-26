import { IGathering } from '../use-cases/entities/gathering'
import { CoordinationQuest, Quest } from '../use-cases/entities/quest'
import {
    GatheringDeclare,
    GatheringMessage,
} from '../use-cases/gathering-declare'
import { EntityNotFound } from '../use-cases/utils/not-found-error'
import { SpawnQuest } from '../use-cases/spawn-quest'
import { createContext } from './test-context'
import { HowWasGatheringTask } from '../use-cases/utils/scheduler'
import { QuestFinishedError } from '../use-cases/utils/errors'

describe('Gathering declaration', () => {
    it('notifies all tribe memebers', async () => {
        const world = await setUp()
        const onGathering = world.spyOnMessage<GatheringMessage>(
            'new-gathering-message'
        )
        await world.gathering.declare({ ...world.defaultDeclare, type: 'all' })
        expect(onGathering).toHaveBeenCalledTimes(world.allTribe.length)
        const actualMembers = onGathering.calls
            .all()
            .map((c) => c.args[0].payload.targetMemberId)
        expect(actualMembers).toEqual(
            jasmine.arrayWithExactContents(world.allTribe)
        )
    })
    it('notifies all upvoters', async () => {
        const world = await setUp()
        const onGathering = world.spyOnMessage<GatheringMessage>(
            'new-gathering-message'
        )
        await world.gathering.declare({
            ...world.defaultDeclare,
            type: 'upvoters',
        })
        expect(onGathering).toHaveBeenCalledTimes(world.upvoters.length)
        const actualMembers = onGathering.calls
            .all()
            .map((c) => c.args[0].payload.targetMemberId)
        expect(actualMembers).toEqual(
            jasmine.arrayWithExactContents(world.upvoters)
        )
    })
    it('allocates "how was it" task next morning', async () => {
        const world = await setUp()
        await world.gathering.declare({
            ...world.defaultDeclare,
            type: 'upvoters',
        })
        const gathering = await world.gatheringStore._last()
        const task = (await world.taskStore._last()) as HowWasGatheringTask
        expect(task).toBeTruthy()
        expect(task!.type).toEqual('how-was-gathering')
        expect(task?.done).toBe(false)
        expect(task!.payload.gatheringId).toEqual(gathering!.id)
        const taskDate = new Date(task!.time)
        const gatheringDateNextDay = new Date(
            world.defaultDeclare.time + 24 * 3_600_000
        )
        expect(taskDate.getDate()).toEqual(gatheringDateNextDay.getDate())
        expect(taskDate.getHours()).toEqual(10)
    })
    it('creates gathering', async () => {
        const world = await setUp()
        const gatheringsBefore = await world.gatheringStore.find({})
        expect(gatheringsBefore).toEqual([])
        await world.gathering.declare({ ...world.defaultDeclare, type: 'all' })
        const gatherings = await world.gatheringStore.find({})
        expect(gatherings.length).toEqual(1)
        expect(gatherings[0]).toEqual(
            jasmine.objectContaining<IGathering>({
                description: world.defaultDeclare.description,
                id: jasmine.any(String),
                place: world.defaultDeclare.place,
                time: world.defaultDeclare.time,
                type: 'all',
            })
        )
    })
    it('FAILs on non-existing quest', async () => {
        const world = await setUp()
        await expectAsync(
            world.gathering.declare({
                ...world.defaultDeclare,
                type: 'all',
                parentQuestId: 'non-existing',
            })
        ).toBeRejectedWithError(EntityNotFound)
    })

    it('FAILs on a finished quest', async () => {
        const world = await setUp()
        world.quest2.memberIds.forEach(world.quest2.finish)
        await world.questStore.save(world.quest2)

        await expectAsync(
            world.gathering.declare({
                ...world.defaultDeclare,
                type: 'all',
            })
        ).toBeRejectedWithError(QuestFinishedError)
    })
})

async function setUp() {
    const context = await createContext()
    const gathering = new GatheringDeclare(context)
    const { tribe, members, idea, upvoters } = await context.testing.makeIdea()

    const [member0, member1] = members

    const quest = await context.stores.questStore.save(
        new CoordinationQuest({
            parentQuestId: null,
            ideaId: idea.id,
            memberIds: [member0.id, member1.id],
            description: 'parent quest',
        })
    )
    const questSpawn = new SpawnQuest(context)

    const quest2 = await questSpawn.spawnQuest({
        description: 'whatever spawned quest',
        memberId: member1.id,
        parentQuestId: quest.id,
    })
    const memberId = members[1].id
    const defaultDeclare = {
        memberId,
        description: 'lets OLOLO!!!',
        parentQuestId: quest2.id,
        place: 'The Foo Bar',
        time: Date.now() + 100_500_000,
    }
    return {
        gathering,
        defaultDeclare,
        quest2,
        members,
        tribe,
        idea,
        upvoters: [...upvoters, idea.meberId].filter((m) => m !== memberId),
        allTribe: members.map((m) => m.id).filter((m) => m !== memberId),
        ...context.stores,
        spyOnMessage: context.testing.spyOnMessage,
    }
}
