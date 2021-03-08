import { Brainstorm, QuestIdea } from '../use-cases/entities/brainstorm'
import { IGathering } from '../use-cases/entities/gathering'
import { Member } from '../use-cases/entities/member'
import { Quest } from '../use-cases/entities/quest'
import { Tribe } from '../use-cases/entities/tribe'
import {
    GatheringDeclare,
    GatheringMessage,
} from '../use-cases/gathering-declare'
import { QuestSource } from '../use-cases/quest-source'
import { createContext, makeMessageSpy } from './test-context'

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

    const tribe = await context.stores.tribeStore.save(
        new Tribe({
            name: 'Foo tribe',
        })
    )
    const members = await context.stores.memberStore.saveBulk(
        [0, 1, 2, 3, 4, 5, 6].map(
            (i) => new Member({ tribeId: tribe.id, userId: `user${i}.id` })
        )
    )

    const [member0, member1] = members

    const brainstorm = await context.stores.brainstormStore.save(
        new Brainstorm({
            tribeId: tribe.id,
            state: 'voting',
        })
    )
    const idea = await context.stores.ideaStore.save(
        new QuestIdea({
            brainstormId: brainstorm.id,
            description: 'let us FOOO!',
            meberId: member0.id,
        })
    )

    const ups = [1, 3, 4, 6]
    const downs = [2, 5]
    ups.forEach((i) => idea.voteUp(members[i].id))
    downs.forEach((i) => idea.voteDown(members[i].id))

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
    const defaultDeclare = {
        memberId: members[1].id,
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
        upvoters: [0, 3, 4, 6].map((i) => members[i].id),
        allTribe: [0, 2, 3, 4, 5, 6].map((i) => members[i].id),
        ...context.stores,
        spyOnMessage: makeMessageSpy(context.async.notififcationBus),
    }
}
