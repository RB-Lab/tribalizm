import { InMemoryApplicationStore } from '../plugins/stores/in-memory-store/application-store'
import { InMemoryBrainstormStore } from '../plugins/stores/in-memory-store/brainstorm-store'
import { InMemoryCityStore } from '../plugins/stores/in-memory-store/city-store'
import { InMemoryGatheringStore } from '../plugins/stores/in-memory-store/gathering-stroe'
import { InMemoryIdeaStore } from '../plugins/stores/in-memory-store/idea-store'
import { InMemoryMemberStore } from '../plugins/stores/in-memory-store/member-store'
import { InMemoryQuestStore } from '../plugins/stores/in-memory-store/quest-store'
import { InMemoryTaskStore } from '../plugins/stores/in-memory-store/task-store'
import { InMemoryTribeStore } from '../plugins/stores/in-memory-store/tribe-store'
import { InMemoryUserStore } from '../plugins/stores/in-memory-store/user-store'

import { MongoApplicationStore } from '../plugins/stores/mongo-store/application-store'
import { MongoBrainstormStore } from '../plugins/stores/mongo-store/brainstorm-store'
import { MongoCityStore } from '../plugins/stores/mongo-store/city-store'
import { MongoGatheringStore } from '../plugins/stores/mongo-store/gathering-stroe'
import { MongoIdeaStore } from '../plugins/stores/mongo-store/idea-store'
import { MongoMemberStore } from '../plugins/stores/mongo-store/member-store'
import { MongoQuestStore } from '../plugins/stores/mongo-store/quest-store'
import { MongoTaskStore } from '../plugins/stores/mongo-store/task-store'
import { MongoTribeStore } from '../plugins/stores/mongo-store/tribe-store'
import { MongoUserStore } from '../plugins/stores/mongo-store/user-store'

import { TestNotificationBus } from '../plugins/notification-bus'
import { Application } from '../use-cases/entities/application'
import { Brainstorm, QuestIdea } from '../use-cases/entities/brainstorm'
import { City } from '../use-cases/entities/city'
import { Gathering } from '../use-cases/entities/gathering'
import { Member } from '../use-cases/entities/member'
import { Quest } from '../use-cases/entities/quest'
import { Tribe } from '../use-cases/entities/tribe'
import { User } from '../use-cases/entities/user'
import { Message } from '../use-cases/utils/message'
import { NotificationBus } from '../use-cases/utils/notification-bus'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { MongoClient } from 'mongodb'

function createInmemroyStores() {
    const ideaStore = new InMemoryIdeaStore(QuestIdea)
    const brainstormStore = new InMemoryBrainstormStore(Brainstorm)
    const applicationStore = new InMemoryApplicationStore(Application)
    const memberStore = new InMemoryMemberStore(Member)
    const questStore = new InMemoryQuestStore(Quest)
    const tribeStore = new InMemoryTribeStore(Tribe)
    const userStore = new InMemoryUserStore(User)
    const taskStore = new InMemoryTaskStore()
    const gatheringStore = new InMemoryGatheringStore(Gathering)
    const cityStore = new InMemoryCityStore(City)
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
    const ideaStore = new MongoIdeaStore(ideasCollection, QuestIdea)
    const brainstormsCollection = await database.createCollection('brainstorm')
    const brainstormStore = new MongoBrainstormStore(
        brainstormsCollection,
        Brainstorm
    )
    const applicationsCollection = await database.createCollection(
        'applications'
    )
    const applicationStore = new MongoApplicationStore(
        applicationsCollection,
        Application
    )
    const membersCollection = await database.createCollection('members')
    const memberStore = new MongoMemberStore(membersCollection, Member)
    const questsCollection = await database.createCollection('quests')
    const questStore = new MongoQuestStore(questsCollection, Quest)
    const tribesCollection = await database.createCollection('tribes')
    const tribeStore = new MongoTribeStore(tribesCollection, Tribe)
    const usersCollection = await database.createCollection('users')
    const userStore = new MongoUserStore(usersCollection, User)
    const tasksCollection = await database.createCollection('tasks')
    const taskStore = new MongoTaskStore(tasksCollection)
    const gatheringsCollection = await database.createCollection('gatherings')
    const gatheringStore = new MongoGatheringStore(
        gatheringsCollection,
        Gathering
    )
    const citiesCollection = await database.createCollection('cities')
    const cityStore = new MongoCityStore(citiesCollection, City)
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

export async function createContext() {
    const notififcationBus = new TestNotificationBus()
    // const stores = await createMongoStores()
    const stores = createInmemroyStores()

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
        ideaCater = 0
    ) => {
        const tribeSize = ups.length + downs.length + neutrals.length + 1
        const { tribe, members } = await makeTribe(tribeSize)
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
                description: 'let us FOOO!',
                meberId: members[ideaCater].id,
            })
        )
        ups.forEach((i) => idea.voteUp(members[i].id))
        downs.forEach((i) => idea.voteDown(members[i].id))
        const upvoters = ups.map((i) => members[i].id)
        const downvoters = downs.map((i) => members[i].id)
        const allTribe = members.map((m) => m.id)
        await stores.ideaStore.save(idea)

        return { tribe, members, idea, upvoters, downvoters, allTribe }
    }
    const testing = {
        spyOnMessage: makeMessageSpy(notififcationBus),
        makeTribe,
        makeIdea,
    }

    return {
        stores,
        async: {
            notififcationBus,
        },
        testing,
    }
}

export function makeMessageSpy(bus: NotificationBus) {
    return <T extends Message>(messageType: T['type']) => {
        const spy = jasmine.createSpy(`on-${messageType}`)
        bus.subscribe(messageType, spy)
        return spy
    }
}
