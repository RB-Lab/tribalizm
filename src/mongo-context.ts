import { Db } from 'mongodb'
import { MongoApplicationStore } from './plugins/stores/mongo-store/application-store'
import { MongoBrainstormStore } from './plugins/stores/mongo-store/brainstorm-store'
import { MongoCityStore } from './plugins/stores/mongo-store/city-store'
import { MongoGatheringStore } from './plugins/stores/mongo-store/gathering-store'
import { MongoIdeaStore } from './plugins/stores/mongo-store/idea-store'
import { MongoMemberStore } from './plugins/stores/mongo-store/member-store'
import { MongoStore } from './plugins/stores/mongo-store/mongo-store'
import { MongoQuestStore } from './plugins/stores/mongo-store/quest-store'
import { MongoTaskStore } from './plugins/stores/mongo-store/task-store'
import { MongoTribeStore } from './plugins/stores/mongo-store/tribe-store'
import { MongoUserStore } from './plugins/stores/mongo-store/user-store'
import {
    TelegramMessageMongoStore,
    TelegramMessageStore,
} from './plugins/ui/telegram/message-store'
import {
    ITelegramUser,
    TelegramUserStore,
} from './plugins/ui/telegram/users-adapter'
import { Stores } from './use-cases/utils/context'

// TODO invert this
export interface MongoStores extends Stores {
    tgUserStore: TelegramUserStore
    messageStore: TelegramMessageStore
}
export function createMongoStores(db: Db): MongoStores {
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

    class MongoTelegramUsersStore extends MongoStore<ITelegramUser> {}
    const tgUsersCollection = db.collection('telegramUsers')
    const tgUserStore = new MongoTelegramUsersStore(tgUsersCollection)
    const messageCollection = db.collection('telegramMessages')
    const messageStore = new TelegramMessageMongoStore(messageCollection)

    const context = {
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
        tgUserStore,
        messageStore,
    }
    return context
}
