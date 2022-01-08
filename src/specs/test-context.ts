import { MongoClient } from 'mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { createMongoStores } from '../mongo-context'
import { Logger } from '../plugins/logger'
import { TestNotificationBus } from '../plugins/notification-bus'
import { InMemoryApplicationStore } from '../plugins/stores/in-memory-store/application-store'
import { InMemoryBrainstormStore } from '../plugins/stores/in-memory-store/brainstorm-store'
import { InMemoryCityStore } from '../plugins/stores/in-memory-store/city-store'
import { InMemoryGatheringStore } from '../plugins/stores/in-memory-store/gathering-store'
import { InMemoryIdeaStore } from '../plugins/stores/in-memory-store/idea-store'
import { InMemoryMemberStore } from '../plugins/stores/in-memory-store/member-store'
import { InMemoryQuestStore } from '../plugins/stores/in-memory-store/quest-store'
import { InMemoryTaskStore } from '../plugins/stores/in-memory-store/task-store'
import { InMemoryTribeStore } from '../plugins/stores/in-memory-store/tribe-store'
import { InMemoryUserStore } from '../plugins/stores/in-memory-store/user-store'
import { noop } from '../ts-utils'
import { Brainstorm, QuestIdea } from '../use-cases/entities/brainstorm'
import { Member } from '../use-cases/entities/member'
import { Tribe } from '../use-cases/entities/tribe'
import { User } from '../use-cases/entities/user'
import { makeTribalizm } from '../use-cases/tribalism'
import { Message } from '../use-cases/utils/message'
import { NotificationBus } from '../use-cases/utils/notification-bus'
import { Scheduler } from '../use-cases/utils/scheduler'
import { TaskDispatcher } from '../use-cases/utils/task-dispatcher'
import { makeViewModels } from '../view-models/view-models'

function createInMemoryStores() {
    const ideaStore = new InMemoryIdeaStore()
    const brainstormStore = new InMemoryBrainstormStore()
    const applicationStore = new InMemoryApplicationStore()
    const memberStore = new InMemoryMemberStore()
    const questStore = new InMemoryQuestStore()
    const tribeStore = new InMemoryTribeStore()
    const userStore = new InMemoryUserStore()
    const taskStore = new InMemoryTaskStore()
    const gatheringStore = new InMemoryGatheringStore()
    const cityStore = new InMemoryCityStore()
    return {
        ideaStore,
        brainstormStore,
        applicationStore,
        memberStore,
        questStore,
        tribeStore,
        userStore,
        taskStore,
        gatheringStore,
        cityStore,
    }
}
type TestStores = ReturnType<typeof createInMemoryStores>

async function createTestMongoStores() {
    const mongod = new MongoMemoryServer()
    const client = new MongoClient(await mongod.getUri(), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })

    await client.connect()
    const database = client.db('test_db-1')
    return createMongoStores(database) as any as TestStores
}

export async function createContext() {
    const logger = new Logger()
    const notificationBus = new TestNotificationBus(logger, noop)
    const stores =
        process.env.FULL_TEST === 'true'
            ? await createTestMongoStores()
            : createInMemoryStores()

    const makeTribe = async (n = 6) => {
        let tribe = await stores.tribeStore.save(
            new Tribe({
                name: 'Foo tribe',
                cityId: 'city',
            })
        )
        const users = await stores.userStore.saveBulk(
            new Array(n).fill(0).map(
                (_, i) =>
                    new User({
                        name: `User ${n}`,
                    })
            )
        )
        const members = await stores.memberStore.saveBulk(
            users.map(
                (user) =>
                    new Member({
                        tribeId: tribe.id,
                        userId: user.id,
                        isCandidate: false,
                    })
            )
        )
        return { tribe, members, users }
    }
    const makeIdea = async (
        ups = [1, 3, 4, 6],
        downs = [2, 5],
        neutrals: number[] = [],
        ideaCreator = 0
    ) => {
        const tribeSize = ups.length + downs.length + neutrals.length + 1
        const { tribe, members, users } = await makeTribe(tribeSize)
        const brainstorm = await stores.brainstormStore.save(
            new Brainstorm({
                tribeId: tribe.id,
                state: 'voting',
                time: Date.now() + 100_500_000,
            })
        )
        const idea = await stores.ideaStore.save(
            new QuestIdea({
                brainstormId: brainstorm.id,
                description: 'let us FOO!',
                memberId: members[ideaCreator].id,
            })
        )
        ups.forEach((i) => idea.voteUp(members[i].id))
        downs.forEach((i) => idea.voteDown(members[i].id))
        const upvoters = ups.map((i) => members[i].id)
        const downVoters = downs.map((i) => members[i].id)
        const allTribe = members.map((m) => m.id)
        await stores.ideaStore.save(idea)

        return { tribe, members, users, idea, upvoters, downVoters, allTribe }
    }
    const testing = {
        spyOnMessage: makeMessageSpy(notificationBus),
        makeTribe,
        makeIdea,
    }

    const context = {
        stores,
        async: {
            notificationBus,
        },
    }

    const tribalizm = makeTribalizm(context)
    const viewModels = makeViewModels(stores)
    const scheduler = new Scheduler(context.stores.taskStore)
    const taskDispatcher = new TaskDispatcher(tribalizm, scheduler, logger)

    async function requestTaskQueue() {
        if (process.env.chatDebug) {
            const tasks = await context.stores.taskStore.findSimple({
                done: false,
            })
            console.log(
                `--- Now is ${new Date()}. Dispatching tasks: ${
                    tasks.length
                } ---`
            )
        }
        await taskDispatcher.run()
    }

    return {
        ...context,
        logger,
        testing,
        tribalizm,
        viewModels,
        requestTaskQueue,
    }
}

export function makeMessageSpy(bus: NotificationBus) {
    return <T extends Message>(messageType: T['type']) => {
        const spy = jasmine.createSpy(`on-${messageType}`)
        bus.subscribe(messageType, spy)
        return spy
    }
}
