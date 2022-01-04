import { IGathering } from '../use-cases/entities/gathering'
import { CoordinationQuest } from '../use-cases/entities/quest'
import {
    GatheringDeclare,
    GatheringMessage,
} from '../use-cases/gathering-declare'
import { SpawnQuest } from '../use-cases/spawn-quest'
import { EntityNotFound } from '../use-cases/utils/not-found-error'
import { createContext } from './test-context'

describe('Gathering declaration', () => {
    it('notifies all tribe members', async () => {
        const world = await setUp()
        const onGathering = world.spyOnMessage<GatheringMessage>(
            'new-gathering-message'
        )
        await world.gathering.declare({ ...world.defaultDeclare, type: 'all' })
        expect(onGathering).toHaveBeenCalledTimes(world.members.length)
        const actualMembers = onGathering.calls
            .all()
            .map((c) => c.args[0].payload.targetUserId)

        expect(actualMembers).toEqual(
            jasmine.arrayWithExactContents(world.members.map((m) => m.userId))
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
            .map((c) => c.args[0].payload.targetUserId)
        const upvoters = await world.memberStore.findSimple({
            id: world.upvoters,
        })
        expect(actualMembers).toEqual(
            jasmine.arrayWithExactContents(upvoters.map((m) => m.userId))
        )
    })
    it('creates gathering', async () => {
        const world = await setUp()
        const gatheringsBefore = await world.gatheringStore.findSimple({})
        expect(gatheringsBefore).toEqual([])
        await world.gathering.declare({ ...world.defaultDeclare, type: 'all' })
        const gatherings = await world.gatheringStore.findSimple({})
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
    const defaultDeclare = {
        userId: member1.userId,
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
        upvoters: [...upvoters, idea.memberId],
        ...context.stores,
        spyOnMessage: context.testing.spyOnMessage,
    }
}
