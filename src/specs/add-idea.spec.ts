import { AddIdea, NewIdeaMessage, StormNotStarted } from '../use-cases/add-idea'
import { BrainstormLifecycle } from '../use-cases/brainstorm-lifecycle'
import { Brainstorm, IQuestIdea } from '../use-cases/entities/brainstorm'
import { Member } from '../use-cases/entities/member'
import { Storable } from '../use-cases/entities/store'
import { NotYourTribe } from '../use-cases/utils/not-your-tribe'
import { StormStart } from '../use-cases/utils/scheduler'
import { createContext } from './test-context'

describe('Add idea', () => {
    it('adds idea', async () => {
        const world = await setUp()
        await world.stromCycle.startStorm(world.startTask)
        await world.ideasAdder.addIdea(world.defReq)
        const ideas = await world.ideaStore.find({})
        expect(ideas.length).toEqual(1)
        expect(ideas[0]).toEqual(
            jasmine.objectContaining<IQuestIdea>(world.defReq)
        )
    })
    it('notifies all members except author', async () => {
        const world = await setUp()
        await world.stromCycle.startStorm(world.startTask)
        const onIdea = world.spyOnMessage<NewIdeaMessage>('new-idea-added')
        await world.ideasAdder.addIdea(world.defReq)
        const idea = await world.ideaStore._last()
        expect(onIdea).toHaveBeenCalledTimes(world.members.length - 1)
        expect(onIdea).toHaveBeenCalledWith(
            jasmine.objectContaining<NewIdeaMessage>({
                type: 'new-idea-added',
                payload: {
                    ideaId: idea!.id,
                    brainstormId: world.brainstorm.id,
                    targetUserId: world.members[0].userId,
                    description: world.defReq.description,
                    targetMemberId: world.members[0].id,
                },
            })
        )
        expect(onIdea).not.toHaveBeenCalledWith(
            jasmine.objectContaining<NewIdeaMessage>({
                payload: {
                    brainstormId: world.brainstorm.id,
                    ideaId: idea!.id,
                    targetUserId: world.members[0].userId,
                    description: world.defReq.description,
                    targetMemberId: world.defReq.memberId,
                },
            })
        )
    })
    it('skips candidates', async () => {
        const world = await setUp()
        await world.stromCycle.startStorm(world.startTask)
        await world.memberStore.save({ ...world.members[1], isCandidate: true })
        const onIdea = world.spyOnMessage<NewIdeaMessage>('new-idea-added')
        await world.ideasAdder.addIdea(world.defReq)
        const idea = await world.ideaStore._last()
        expect(onIdea).not.toHaveBeenCalledWith(
            jasmine.objectContaining<NewIdeaMessage>({
                payload: {
                    brainstormId: world.brainstorm.id,
                    ideaId: idea!.id,
                    targetUserId: world.members[0].userId,
                    description: world.defReq.description,
                    targetMemberId: world.members[1].id,
                },
            })
        )
    })
    it('FAILs if member is not from the tribe', async () => {
        const world = await setUp()
        const member = await world.memberStore.save(
            new Member({
                tribeId: 'other',
                userId: 'user',
            })
        )
        await expectAsync(
            world.ideasAdder.addIdea({ ...world.defReq, memberId: member.id })
        ).toBeRejectedWithError(NotYourTribe)
    })
    it('FAILs if brainstorm is not in generating phase', async () => {
        const world = await setUp()
        await expectAsync(
            world.ideasAdder.addIdea(world.defReq)
        ).toBeRejectedWithError(StormNotStarted)
    })
})

async function setUp() {
    const context = await createContext()
    const { tribe, members } = await context.testing.makeTribe()
    const stromCycle = new BrainstormLifecycle(context)
    await stromCycle.declare({
        memberId: tribe.chiefId!,
        time: Date.now() + 100_500_000,
    })
    let brainstorm = await context.stores.brainstormStore._last()
    const tasks = await context.stores.taskStore.find({
        type: 'start-brainstorm',
    })
    const startTask = tasks[0] as StormStart & Storable

    const ideasAdder = new AddIdea(context)

    const defReq = {
        brainstormId: brainstorm.id,
        description: 'Lets OLOLO!',
        memberId: members[3].id,
    }
    return {
        ideasAdder,
        brainstorm,
        stromCycle,
        startTask,
        tribe,
        members,
        defReq,
        ...context.stores,
        spyOnMessage: context.testing.spyOnMessage,
    }
}
