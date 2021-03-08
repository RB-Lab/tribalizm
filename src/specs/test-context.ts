import { InMemoryApplicationStore } from '../plugins/testing/application-store'
import { InMemoryBrainstormStore } from '../plugins/testing/brainstorm-store'
import { InMemoryGatheringStore } from '../plugins/testing/gathering-stroe'
import { InMemoryIdeaStore } from '../plugins/testing/idea-store'
import { getKeys, isValidObjectKey } from '../plugins/testing/in-memory-store'
import { InMemoryMemberStore } from '../plugins/testing/member-store'
import { TestNotificationBus } from '../plugins/testing/notification-bus'
import { InMemoryQuestStore } from '../plugins/testing/quest-store'
import { InMemoryTaskStore } from '../plugins/testing/task-store'
import { InMemoryTribeStore } from '../plugins/testing/tribe-store'
import { InMemoryUserStore } from '../plugins/testing/user-store'
import { Brainstorm, QuestIdea } from '../use-cases/entities/brainstorm'
import { Gathering } from '../use-cases/entities/gathering'
import { Quest } from '../use-cases/entities/quest'
import { Message } from '../use-cases/message'
import { NotificationBus } from '../use-cases/notification-bus'

export function assign<T extends object>(doc: T, update: Partial<T>) {
    const keys = getKeys(doc)
    return keys.reduce((res, key) => {
        if (!isValidObjectKey(key, doc)) return res
        return { ...res, [key]: key in update ? update[key] : doc[key] }
    }, {} as T)
}

export function createContext() {
    const notififcationBus = new TestNotificationBus()
    const ideaStore = new InMemoryIdeaStore(QuestIdea)
    const brainstormStore = new InMemoryBrainstormStore(Brainstorm)
    const applicationStore = new InMemoryApplicationStore()
    const memberStore = new InMemoryMemberStore()
    const questStore = new InMemoryQuestStore(Quest)
    const tribeStore = new InMemoryTribeStore()
    const userStore = new InMemoryUserStore()
    const taskStore = new InMemoryTaskStore()
    const gatheringStore = new InMemoryGatheringStore(Gathering)

    return {
        stores: {
            ideaStore,
            brainstormStore,
            applicationStore,
            memberStore,
            questStore,
            tribeStore,
            userStore,
            taskStore,
            gatheringStore,
        },
        async: {
            notififcationBus,
        },
    }
}

export function makeMessageSpy(bus: NotificationBus) {
    return <T extends Message>(messageType: T['type']) => {
        const spy = jasmine.createSpy(`on${messageType}`)
        bus.subscribe(messageType, spy)
        return spy
    }
}
