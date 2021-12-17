import { MongoClient } from 'mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'
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
import { MongoApplicationStore } from '../plugins/stores/mongo-store/application-store'
import { MongoBrainstormStore } from '../plugins/stores/mongo-store/brainstorm-store'
import { MongoCityStore } from '../plugins/stores/mongo-store/city-store'
import { MongoGatheringStore } from '../plugins/stores/mongo-store/gathering-store'
import { MongoIdeaStore } from '../plugins/stores/mongo-store/idea-store'
import { MongoMemberStore } from '../plugins/stores/mongo-store/member-store'
import { MongoQuestStore } from '../plugins/stores/mongo-store/quest-store'
import { MongoTaskStore } from '../plugins/stores/mongo-store/task-store'
import { MongoTribeStore } from '../plugins/stores/mongo-store/tribe-store'
import { MongoUserStore } from '../plugins/stores/mongo-store/user-store'
import { noop } from '../ts-utils'
import { Brainstorm, QuestIdea } from '../use-cases/entities/brainstorm'
import { IMember, Member } from '../use-cases/entities/member'
import { Tribe } from '../use-cases/entities/tribe'
import { User } from '../use-cases/entities/user'
import { makeTribalizm } from '../use-cases/tribalism'
import { Message } from '../use-cases/utils/message'
import { NotificationBus } from '../use-cases/utils/notification-bus'
import { Scheduler } from '../use-cases/utils/scheduler'
import { TaskDispatcher } from '../use-cases/utils/task-dispatcher'

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

async function createMongoStores() {
    const mongod = new MongoMemoryServer()
    const client = new MongoClient(await mongod.getUri(), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })

    await client.connect()
    const database = client.db('test_db-1')

    const ideasCollection = await database.createCollection('idea')
    const ideaStore = new MongoIdeaStore(ideasCollection)
    const brainstormsCollection = await database.createCollection('brainstorm')
    const brainstormStore = new MongoBrainstormStore(brainstormsCollection)
    const applicationsCollection = await database.createCollection(
        'applications'
    )
    const applicationStore = new MongoApplicationStore(applicationsCollection)
    const membersCollection = await database.createCollection('members')
    const memberStore = new MongoMemberStore(membersCollection)
    const questsCollection = await database.createCollection('quests')
    const questStore = new MongoQuestStore(questsCollection)
    const tribesCollection = await database.createCollection('tribes')
    const tribeStore = new MongoTribeStore(tribesCollection)
    const usersCollection = await database.createCollection('users')
    const userStore = new MongoUserStore(usersCollection)
    const tasksCollection = await database.createCollection('tasks')
    const taskStore = new MongoTaskStore(tasksCollection)
    const gatheringsCollection = await database.createCollection('gatherings')
    const gatheringStore = new MongoGatheringStore(gatheringsCollection)
    const citiesCollection = await database.createCollection('cities')
    const cityStore = new MongoCityStore(citiesCollection)
    return {
        ideaStore: ideaStore as any as InMemoryIdeaStore,
        brainstormStore: brainstormStore as any as InMemoryBrainstormStore,
        applicationStore: applicationStore as any as InMemoryApplicationStore,
        memberStore: memberStore as any as InMemoryMemberStore,
        questStore: questStore as any as InMemoryQuestStore,
        tribeStore: tribeStore as any as InMemoryTribeStore,
        userStore: userStore as any as InMemoryUserStore,
        taskStore: taskStore as any as InMemoryTaskStore,
        gatheringStore: gatheringStore as any as InMemoryGatheringStore,
        cityStore: cityStore as any as InMemoryCityStore,
    }
}

export async function createContext() {
    const logger = new Logger()
    const notificationBus = new TestNotificationBus(logger, noop)
    const stores =
        process.env.FULL_TEST === 'true'
            ? await createMongoStores()
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
        tribe = await stores.tribeStore.save({
            ...tribe,
            chiefId: members[0].id,
            shamanId: members[1] ? members[1].id : null,
        })
        await stores.memberStore.save({ ...members[0], charisma: 3 })
        if (members[1]) {
            await stores.memberStore.save({ ...members[1], wisdom: 3 })
        }
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
    async function addVotes(member: IMember, c: number, w: number) {
        const arr = Array(5).fill(0)
        arr.forEach(() => {
            member.castVote({
                casted: 0,
                charisma: c,
                wisdom: w,
                memberId: 'dd',
                questId: 'dfw',
                type: 'quest-vote',
            })
        })
        context.stores.memberStore.save(member)
    }

    const tribalizm = makeTribalizm(context)
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
        addVotes,
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
