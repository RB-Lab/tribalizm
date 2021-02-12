import { InMemoryApplicationStore } from '../plugins/testing/application-store'
import { InMemoryBrainstormStore } from '../plugins/testing/brainstorm-store'
import { InMemoryIdeaStore } from '../plugins/testing/idea-store'
import { getKeys, isValidObjectKey } from '../plugins/testing/in-memory-store'
import { InMemoryMemberStore } from '../plugins/testing/member-store'
import { TestNotificationBus } from '../plugins/testing/notification-bus'
import { InMemoryQuestStore } from '../plugins/testing/quest-store'
import { InMemoryTribeStore } from '../plugins/testing/tribe-store'
import { InMemoryUserStore } from '../plugins/testing/user-store'

export function assign<T extends object>(doc: T, update: Partial<T>) {
    const keys = getKeys(doc)
    return keys.reduce((res, key) => {
        if (!isValidObjectKey(key, doc)) return res
        return { ...res, [key]: key in update ? update[key] : doc[key] }
    }, {} as T)
}

export function createContext() {
    const notififcationBus = new TestNotificationBus()
    const ideasStore = new InMemoryIdeaStore()
    const brainstormStore = new InMemoryBrainstormStore()
    const applicationStore = new InMemoryApplicationStore()
    const memberStore = new InMemoryMemberStore()
    const questStore = new InMemoryQuestStore()
    const tribeStore = new InMemoryTribeStore()
    const userStore = new InMemoryUserStore()

    return {
        stores: {
            ideasStore,
            brainstormStore,
            applicationStore,
            memberStore,
            questStore,
            tribeStore,
            userStore,
        },
        async: {
            notififcationBus,
        },
    }
}
