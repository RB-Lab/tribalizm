import { IGathering } from '../use-cases/entities/gathering'
import { Quest } from '../use-cases/entities/quest'
import {
    GatheringDeclare,
    GatheringMessage,
} from '../use-cases/gathering-declare'
import { QuestSource } from '../use-cases/quest-source'
import { createContext } from './test-context'

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
})

async function setUp() {
    const context = createContext()
    const gathering = new GatheringDeclare(context)
    const { tribe, members, idea, upvoters } = await context.testing.makeIdea()

    const [member0, member1] = members

    const quest = await context.stores.questStore.save(
        new Quest({
            ideaId: idea.id,
            memberIds: [member0.id, member1.id],
            description: 'parent quest',
        })
    )
    const questSpawn = new QuestSource(context)

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
        time: 100500100500,
    }
    return {
        gathering,
        defaultDeclare,
        members,
        tribe,
        idea,
        upvoters: [...upvoters, idea.meberId].filter((m) => m !== memberId),
        allTribe: members.map((m) => m.id).filter((m) => m !== memberId),
        ...context.stores,
        spyOnMessage: context.testing.spyOnMessage,
    }
}
