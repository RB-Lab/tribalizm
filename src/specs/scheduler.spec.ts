import { Scheduler } from '../use-cases/utils/scheduler'
import { createContext } from './test-context'

describe('Task scheduling', () => {
    it('schedules a task', async () => {
        const world = await setUp()
        await world.scheduler.schedule({
            done: false,
            type: 'foo',
            payload: null,
            time: Date.now() + 100_500_000,
        })
        const tasks = await world.taskStore.find({})
        expect(tasks.length).toEqual(1)
    })
})

describe('Task retrieval', () => {
    it('gets all not done tasks with past time', async () => {
        const world = await setUp()
        world.scheduler.schedule({
            done: false,
            type: 'future',
            payload: null,
            time: Date.now() + 100_500_000,
        })
        world.scheduler.schedule({
            done: false,
            type: 'past',
            payload: null,
            time: Date.now() - 100_500_000,
        })
        world.scheduler.schedule({
            done: true,
            type: 'past',
            payload: null,
            time: Date.now() - 100_500_000,
        })
        const tasks = await world.scheduler.getTasks()
        expect(tasks.length).toEqual(1)
        expect(tasks[0].done).toBe(false)
        expect(tasks[0].type).toBe('past')
    })
})

describe('Task marking', () => {
    it('marks task as done', async () => {
        const world = await setUp()
        await world.scheduler.schedule({
            done: false,
            type: 'foo',
            payload: null,
            time: Date.now() - 100_500_000,
        })
        const task = (await world.scheduler.getTasks())[0]
        await world.scheduler.markDone(task.id)
        const taskAgain = await world.taskStore.getById(task.id)
        expect(taskAgain!.done).toBe(true)
    })
})

async function setUp() {
    const context = createContext()

    const scheduler = new Scheduler(context.stores.taskStore)
    return {
        scheduler,
        ...context.stores,
    }
}
