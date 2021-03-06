import {
    BrainstormDeclarationMessage,
    BrainstormNoticeMessage,
    BrainstormStartedMessage,
    BrainstormLifecycle,
    NotAChiefError,
    VotingStartedMessage,
    StormEndedMessage,
} from '../use-cases/brainstorm-lifecycle'
import {
    Brainstorm,
    FinalizeBeforeVotingError,
    IBrainstormData,
} from '../use-cases/entities/brainstorm'
import {
    isStormFinalize,
    isStormNotify,
    isStormStart,
    isStormToVoting,
    StormFinalize,
    StormNotify,
    StormStart,
    StormToVoting,
} from '../use-cases/utils/scheduler'
import { createContext } from './test-context'

describe('Brainstorm lifecycle', () => {
    it('notifies all members on declared brainstorm', async () => {
        const world = await setUp()
        const onDeclare =
            world.spyOnMessage<BrainstormDeclarationMessage>('new-brainstorm')
        await world.stormCycle.declare(world.defReq)
        expect(onDeclare).toHaveBeenCalledTimes(world.members.length)
        expect(onDeclare).toHaveBeenCalledWith(
            jasmine.objectContaining<BrainstormDeclarationMessage>({
                type: 'new-brainstorm',
                payload: {
                    targetUserId: jasmine.any(String),
                    brainstormId: jasmine.any(String),
                    targetMemberId: jasmine.any(String),
                    time: world.defReq.time,
                },
            })
        )
        const notified = onDeclare.calls
            .allArgs()
            .map((args) => args[0].payload.targetMemberId)
        const all = world.members.filter((m) => !m.isCandidate).map((m) => m.id)
        expect(notified).toEqual(all)
    })
    it('skips candidate', async () => {
        const world = await setUp()
        const candidate = world.members[world.members.length - 1]
        candidate.isCandidate = true
        await world.memberStore.save(candidate)
        const onDeclare =
            world.spyOnMessage<BrainstormDeclarationMessage>('new-brainstorm')
        await world.stormCycle.declare(world.defReq)
        const notified = onDeclare.calls
            .allArgs()
            .map((args) => args[0].payload.targetMemberId)
        expect(notified).not.toContain(candidate.id)
    })
    it('creates a brainstorm', async () => {
        const world = await setUp()
        await world.stormCycle.declare(world.defReq)
        const storms = await world.brainstormStore.findSimple({})
        expect(storms.length).toBe(1)
        expect(storms[0]).toEqual(
            jasmine.objectContaining<IBrainstormData>({
                tribeId: world.tribe.id,
                state: 'initiated',
                time: world.defReq.time,
            })
        )
    })
    it('allocates two tasks to notify about storm', async () => {
        const world = await setUp()
        await world.stormCycle.declare(world.defReq)
        const tasks = await world.taskStore.findSimple({
            type: 'notify-brainstorm',
        })
        const storms = await world.brainstormStore.findSimple({})
        expect(tasks.length).toEqual(2)
        expect(tasks[0]).toEqual(
            jasmine.objectContaining<StormNotify>({
                done: false,
                time: storms[0].time - 6 * 3600_000,
                type: 'notify-brainstorm',
                payload: {
                    brainstormId: storms[0].id,
                },
            })
        )
        expect(tasks[1]).toEqual(
            jasmine.objectContaining<StormNotify>({
                done: false,
                time: storms[0].time - 5 * 60_000,
                type: 'notify-brainstorm',
                payload: {
                    brainstormId: storms[0].id,
                },
            })
        )
    })
    it('allocates a task to start brainstorm', async () => {
        const world = await setUp()
        await world.stormCycle.declare(world.defReq)
        const tasks = await world.taskStore.findSimple({
            type: 'start-brainstorm',
        })
        const storms = await world.brainstormStore.findSimple({})
        expect(tasks.length).toEqual(1)
        expect(tasks[0]).toEqual(
            jasmine.objectContaining<StormStart>({
                done: false,
                time: storms[0].time,
                type: 'start-brainstorm',
                payload: {
                    brainstormId: storms[0].id,
                },
            })
        )
    })
    it('notifies members that storm is near!', async () => {
        const world = await setUp()
        const onNotify =
            world.spyOnMessage<BrainstormNoticeMessage>('brainstorm-notice')
        const brainstorm = await world.brainstormStore.save(
            new Brainstorm({
                time: Date.now() + 100_500_000,
                tribeId: world.tribe.id,
            })
        )
        const task = await world.taskStore.save({
            type: 'notify-brainstorm',
            done: false,
            time: Date.now(),
            payload: { brainstormId: brainstorm.id },
        })
        if (isStormNotify(task)) {
            await world.stormCycle.notifyMembers(task)
        }
        expect(onNotify).toHaveBeenCalledTimes(world.members.length)
        expect(onNotify).toHaveBeenCalledWith(
            jasmine.objectContaining<BrainstormNoticeMessage>({
                type: 'brainstorm-notice',
                payload: {
                    targetUserId: world.members[1].userId,
                    targetMemberId: world.members[1].id,
                    brainstormId: brainstorm.id,
                    time: brainstorm.time,
                },
            })
        )
        const doneTask = await world.taskStore.getById(task.id)
        expect(doneTask!.done).toBe(true)
    })
    it('it notifies members that storm started', async () => {
        const world = await setUp()
        const onStart =
            world.spyOnMessage<BrainstormStartedMessage>('brainstorm-started')
        const { brainstorm, task } = await world.startStorm()

        expect(onStart).toHaveBeenCalledTimes(world.members.length)
        expect(onStart).toHaveBeenCalledWith(
            jasmine.objectContaining<BrainstormStartedMessage>({
                type: 'brainstorm-started',
                payload: {
                    brainstormId: brainstorm.id,
                    targetMemberId: world.members[1].id,
                    targetUserId: world.members[1].userId,
                },
            })
        )
    })

    it('starts the storm', async () => {
        const world = await setUp()
        const { brainstorm } = await world.startStorm()
        const startedBrainstorm = await world.brainstormStore.getById(
            brainstorm.id
        )
        expect(startedBrainstorm?.state).toEqual('generation')
    })
    // FLICK
    it('marks StormStart done', async () => {
        const world = await setUp()
        const { task } = await world.startStorm()
        const taskAfter = await world.taskStore.getById(task.id)
        expect(task.done).withContext('task before').toBe(false)
        expect(taskAfter!.done).withContext('task after').toBe(true)
    })
    it('allocates a task for storm transition', async () => {
        const world = await setUp()
        const { brainstorm } = await world.startStorm()
        const tasks = await world.taskStore.findSimple({
            type: 'brainstorm-to-voting',
        })
        expect(tasks.length).toEqual(1)
        expect(tasks[0]).toEqual(
            jasmine.objectContaining<StormToVoting>({
                done: false,
                time: jasmine.any(Number),
                type: 'brainstorm-to-voting',
                payload: { brainstormId: brainstorm.id },
            })
        )
        expect(tasks[0].time).toBeGreaterThan(Date.now() + 10 * 60_000 - 1000)
        expect(tasks[0].time).toBeLessThan(Date.now() + 10 * 60_000 + 1000)
    })
    it('transitions storm to voting', async () => {
        const world = await setUp()
        const { brainstorm } = await world.stormToVoting()
        const storm = await world.brainstormStore.getById(brainstorm.id)
        expect(storm?.state).toEqual('voting')
    })
    it('marks StormToVoting task as done', async () => {
        const world = await setUp()
        const { task } = await world.stormToVoting()
        const taskAfter = await world.taskStore.getById(task.id)
        expect(task.done).withContext('task before').toBe(false)
        expect(taskAfter!.done).withContext('task after').toBe(true)
    })
    it('Notifies all members on start voting', async () => {
        const world = await setUp()
        const onVoting =
            world.spyOnMessage<VotingStartedMessage>('voting-started')
        const { brainstorm } = await world.stormToVoting()
        expect(onVoting).toHaveBeenCalledTimes(world.members.length)
        expect(onVoting).toHaveBeenCalledWith(
            jasmine.objectContaining<VotingStartedMessage>({
                type: 'voting-started',
                payload: {
                    targetUserId: world.members[1].userId,
                    brainstormId: brainstorm.id,
                    targetMemberId: world.members[1].id,
                },
            })
        )
    })
    it('Allocates a task for storm to end', async () => {
        const world = await setUp()
        const { brainstorm } = await world.stormToVoting()
        const tasks = await world.taskStore.findSimple({
            type: 'brainstorm-to-finalize',
        })
        expect(tasks.length).toEqual(1)
        expect(tasks[0]).toEqual(
            jasmine.objectContaining<StormFinalize>({
                done: false,
                time: jasmine.any(Number),
                type: 'brainstorm-to-finalize',
                payload: { brainstormId: brainstorm.id },
            })
        )
        expect(tasks[0].time).toBeGreaterThan(Date.now() + 5 * 60_000 - 1000)
        expect(tasks[0].time).toBeLessThan(Date.now() + 5 * 60_000 + 1000)
    })

    it('finalizes the storm', async () => {
        const world = await setUp()
        const { brainstorm } = await world.stormToVoting()
        const task = await world.taskStore._last()

        if (isStormFinalize(task)) {
            await world.stormCycle.finalize(task)
        }
        const storm = await world.brainstormStore.getById(brainstorm.id)

        expect(storm?.state).toEqual('finished')
    })
    it('notifies all the members that storm ended', async () => {
        const world = await setUp()
        const onEnded =
            world.spyOnMessage<StormEndedMessage>('brainstorm-ended')
        const { brainstorm } = await world.stormToVoting()
        const task = await world.taskStore._last()

        if (isStormFinalize(task)) {
            await world.stormCycle.finalize(task)
        }
        expect(onEnded).toHaveBeenCalledTimes(world.members.length)
        expect(onEnded).toHaveBeenCalledWith(
            jasmine.objectContaining<StormEndedMessage>({
                type: 'brainstorm-ended',
                payload: {
                    targetUserId: world.members[1].userId,
                    brainstormId: brainstorm.id,
                    targetMemberId: world.members[1].id,
                },
            })
        )
    })

    it('FAILs to finalize a storm not in voting phase', async () => {
        const world = await setUp()
        const { brainstorm } = await world.startStorm()
        return expectAsync(
            world.stormCycle.finalize({
                type: 'brainstorm-to-finalize',
                time: Date.now(),
                done: false,
                payload: { brainstormId: brainstorm.id },
            })
        ).toBeRejectedWithError(FinalizeBeforeVotingError)
    })
})

async function setUp() {
    const context = await createContext()
    const { members, tribe } = await context.testing.makeTribe()
    await context.stores.tribeStore.save(tribe)
    const stormCycle = new BrainstormLifecycle(context)
    const time = Date.now() + 5 * 24 * 3600000
    const defReq = {
        tribeId: tribe.id,
        time: time,
    }

    const startStorm = async () => {
        const brainstorm = await context.stores.brainstormStore.save(
            new Brainstorm({ time: Date.now(), tribeId: tribe.id })
        )
        const task = await context.stores.taskStore.save({
            type: 'start-brainstorm',
            done: false,
            time: Date.now(),
            payload: { brainstormId: brainstorm.id },
        })
        if (isStormStart(task)) {
            await stormCycle.startStorm(task)
        }
        return { task, brainstorm }
    }
    const stormToVoting = async () => {
        const { brainstorm } = await startStorm()
        const task = (
            await context.stores.taskStore.findSimple({
                type: 'brainstorm-to-voting',
            })
        )[0]
        if (isStormToVoting(task)) {
            await stormCycle.toVoting(task)
        }
        return { task, brainstorm }
    }
    return {
        ...context.stores,
        stormCycle,
        tribe,
        members,
        defReq,
        spyOnMessage: context.testing.spyOnMessage,
        startStorm,
        stormToVoting,
    }
}
