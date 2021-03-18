import {
    BrainstormDeclarationMessage,
    BrainstormNoticeMessage,
    BrainstormStartedMessage,
    DeclareBrainstorm,
    NotAChiefError,
} from '../use-cases/declare-brainstorm'
import { Brainstorm, IBrainstormData } from '../use-cases/entities/brainstorm'
import {
    isStormNotify,
    isStormStart,
    StormNotify,
    StormStart,
} from '../use-cases/utils/scheduler'
import { createContext } from './test-context'

describe('Brainstorm declaration', () => {
    it('notifies all members on declared brainstorm', async () => {
        const world = await setUp()
        const onDeclare = world.spyOnMessage<BrainstormDeclarationMessage>(
            'new-brainstorm'
        )
        await world.stromDeclaration.declare(world.defReq)
        expect(onDeclare).toHaveBeenCalledTimes(world.members.length - 2)
        expect(onDeclare).toHaveBeenCalledWith(
            jasmine.objectContaining<BrainstormDeclarationMessage>({
                type: 'new-brainstorm',
                payload: {
                    brainstormId: jasmine.any(String),
                    targetMemberId: jasmine.any(String),
                    time: world.defReq.time,
                },
            })
        )
        const notified = onDeclare.calls
            .allArgs()
            .map((args) => args[0].payload.targetMemberId)
        const all = world.members
            .filter((m) => m.id !== world.tribe.chiefId && !m.isCandidate)
            .map((m) => m.id)
        expect(notified).toEqual(all)
    })
    it('skips candidate', async () => {
        const world = await setUp()
        const onDeclare = world.spyOnMessage<BrainstormDeclarationMessage>(
            'new-brainstorm'
        )
        await world.stromDeclaration.declare(world.defReq)
        const notified = onDeclare.calls
            .allArgs()
            .map((args) => args[0].payload.targetMemberId)
        expect(notified).not.toContain(world.candidate)
    })
    it('creates a brainstorm', async () => {
        const world = await setUp()
        await world.stromDeclaration.declare(world.defReq)
        const storms = await world.brainstormStore.find({})
        expect(storms.length).toBe(1)
        expect(storms[0]).toEqual(
            jasmine.objectContaining<IBrainstormData>({
                tribeId: world.tribe.id,
                state: 'initiated',
                time: world.defReq.time,
            })
        )
    })
    it('alocates two tasks to notify about storm', async () => {
        const world = await setUp()
        await world.stromDeclaration.declare(world.defReq)
        const tasks = await world.taskStore.find({ type: 'notfy-brainstorm' })
        const storms = await world.brainstormStore.find({})
        expect(tasks.length).toEqual(2)
        expect(tasks[0]).toEqual(
            jasmine.objectContaining<StormNotify>({
                done: false,
                time: storms[0].time - 6 * 3600_000,
                type: 'notfy-brainstorm',
                payload: {
                    brainstormId: storms[0].id,
                },
            })
        )
        expect(tasks[1]).toEqual(
            jasmine.objectContaining<StormNotify>({
                done: false,
                time: storms[0].time - 5 * 60_000,
                type: 'notfy-brainstorm',
                payload: {
                    brainstormId: storms[0].id,
                },
            })
        )
    })
    it('alocates a task to start brainstorm', async () => {
        const world = await setUp()
        await world.stromDeclaration.declare(world.defReq)
        const tasks = await world.taskStore.find({ type: 'start-brainstorm' })
        const storms = await world.brainstormStore.find({})
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
    it('FAILs to declare not by chief', async () => {
        const world = await setUp()
        await expectAsync(
            world.stromDeclaration.declare({
                memberId: world.members[3].id,
                time: Date.now(),
            })
        ).toBeRejectedWithError(NotAChiefError)
    })

    it('notifies members that sotorm is near!', async () => {
        const world = await setUp()
        const onNotify = world.spyOnMessage<BrainstormNoticeMessage>(
            'brainstorm-notice'
        )
        const brainstorm = await world.brainstormStore.save(
            new Brainstorm({
                time: Date.now() + 100_500_000,
                tribeId: world.tribe.id,
            })
        )
        const task = await world.taskStore.save({
            type: 'notfy-brainstorm',
            done: false,
            time: Date.now(),
            payload: { brainstormId: brainstorm.id },
        })
        if (isStormNotify(task)) {
            await world.stromDeclaration.notifyMembers(task)
        }
        expect(onNotify).toHaveBeenCalledTimes(world.members.length - 1)
        expect(onNotify).toHaveBeenCalledWith(
            jasmine.objectContaining<BrainstormNoticeMessage>({
                type: 'brainstorm-notice',
                payload: {
                    brainstormId: brainstorm.id,
                    targetMemberId: world.members[1].id,
                    time: brainstorm.time,
                },
            })
        )
        const doneTask = await world.taskStore.getById(task.id)
        expect(doneTask!.done).toBe(true)
    })
    it('it notifies members that storm started', async () => {
        const world = await setUp()
        const onStart = world.spyOnMessage<BrainstormStartedMessage>(
            'brainstorm-started'
        )
        const brainstorm = await world.brainstormStore.save(
            new Brainstorm({
                time: Date.now() + 100_500_000,
                tribeId: world.tribe.id,
            })
        )
        const task = await world.taskStore.save({
            type: 'start-brainstorm',
            done: false,
            time: Date.now(),
            payload: { brainstormId: brainstorm.id },
        })
        if (isStormStart(task)) {
            await world.stromDeclaration.startStorm(task)
        }

        expect(onStart).toHaveBeenCalledTimes(world.members.length - 1)
        expect(onStart).toHaveBeenCalledWith(
            jasmine.objectContaining<BrainstormStartedMessage>({
                type: 'brainstorm-started',
                payload: {
                    brainstormId: brainstorm.id,
                    targetMemberId: world.members[1].id,
                },
            })
        )
        const doneTask = await world.taskStore.getById(task.id)
        expect(doneTask!.done).toBe(true)
    })
    it('starts the storm', async () => {
        const world = await setUp()
        const brainstorm = await world.brainstormStore.save(
            new Brainstorm({
                time: Date.now() + 100_500_000,
                tribeId: world.tribe.id,
            })
        )
        const task = await world.taskStore.save({
            type: 'start-brainstorm',
            done: false,
            time: Date.now(),
            payload: { brainstormId: brainstorm.id },
        })
        if (isStormStart(task)) {
            await world.stromDeclaration.startStorm(task)
        }
        const startedBrainstor = await world.brainstormStore.getById(
            brainstorm.id
        )
        expect(startedBrainstor?.state).toEqual('generation')
    })
})

async function setUp() {
    const context = createContext()
    const { members, tribe } = await context.testing.makeTribe()
    tribe.chiefId = members[0].id
    const candidate = members[members.length - 1]
    candidate.isCandidate = true
    await context.stores.memberStore.save(candidate)
    await context.stores.tribeStore.save(tribe)
    const stromDeclaration = new DeclareBrainstorm(context)
    const time = Date.now() + 5 * 24 * 3600000
    const defReq = {
        memberId: tribe.chiefId!,
        time: time,
    }
    return {
        ...context.stores,
        candidate,
        stromDeclaration,
        tribe,
        members,
        defReq,
        spyOnMessage: context.testing.spyOnMessage,
    }
}
