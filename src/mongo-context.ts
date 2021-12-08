import { Db } from 'mongodb'
import { TestNotificationBus } from './plugins/notification-bus'
import { MongoApplicationStore } from './plugins/stores/mongo-store/application-store'
import { MongoBrainstormStore } from './plugins/stores/mongo-store/brainstorm-store'
import { MongoCityStore } from './plugins/stores/mongo-store/city-store'
import { MongoGatheringStore } from './plugins/stores/mongo-store/gathering-store'
import { MongoIdeaStore } from './plugins/stores/mongo-store/idea-store'
import { MongoMemberStore } from './plugins/stores/mongo-store/member-store'
import { MongoQuestStore } from './plugins/stores/mongo-store/quest-store'
import { MongoTaskStore } from './plugins/stores/mongo-store/task-store'
import { MongoTribeStore } from './plugins/stores/mongo-store/tribe-store'
import { MongoUserStore } from './plugins/stores/mongo-store/user-store'
import { Context } from './use-cases/utils/context'
import { MongoStore } from './plugins/stores/mongo-store/mongo-store'
import {
    ITelegramUser,
    StoreTelegramUsersAdapter,
} from './plugins/ui/telegram/users-adapter'
import { UserStore } from './use-cases/entities/user'
import { TelegramMessageMongoStore } from './plugins/ui/telegram/message-store'
import { ILogger } from './use-cases/utils/logger'

export function createMongoContext(db: Db) {
    const ideasCollection = db.collection('idea')
    const ideaStore = new MongoIdeaStore(ideasCollection)
    const brainstormsCollection = db.collection('brainstorm')
    const brainstormStore = new MongoBrainstormStore(brainstormsCollection)
    const applicationsCollection = db.collection('applications')
    const applicationStore = new MongoApplicationStore(applicationsCollection)
    const membersCollection = db.collection('members')
    const memberStore = new MongoMemberStore(membersCollection)
    const questsCollection = db.collection('quests')
    const questStore = new MongoQuestStore(questsCollection)
    const tribesCollection = db.collection('tribes')
    const tribeStore = new MongoTribeStore(tribesCollection)
    const usersCollection = db.collection('users')
    const userStore = new MongoUserStore(usersCollection)
    const tasksCollection = db.collection('tasks')
    const taskStore = new MongoTaskStore(tasksCollection)
    const gatheringsCollection = db.collection('gatherings')
    const gatheringStore = new MongoGatheringStore(gatheringsCollection)
    const citiesCollection = db.collection('cities')
    const cityStore = new MongoCityStore(citiesCollection)
    const context: Context['stores'] = {
        applicationStore,
        brainstormStore,
        cityStore,
        gatheringStore,
        ideaStore,
        memberStore,
        questStore,
        taskStore,
        tribeStore,
        userStore,
    }
    return context
}

export function createMongoTelegramContext(db: Db, userStore: UserStore) {
    class MongoTelegramUsersStore extends MongoStore<ITelegramUser> {}
    const tgUsersCollection = db.collection('telegramUsers')
    const tgUserStore = new MongoTelegramUsersStore(tgUsersCollection)
    const tgUsersAdapter = new StoreTelegramUsersAdapter(userStore, tgUserStore)
    const messageCollection = db.collection('telegramMessages')
    const messageStore = new TelegramMessageMongoStore(messageCollection)

    return { tgUserStore, tgUsersAdapter, messageStore }
}
