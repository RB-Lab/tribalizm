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
import { Member } from '../use-cases/entities/member'
import { Quest } from '../use-cases/entities/quest'
import { Tribe } from '../use-cases/entities/tribe'
import { User } from '../use-cases/entities/user'
import { Message } from '../use-cases/utils/message'
import { NotificationBus } from '../use-cases/utils/notification-bus'

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
    const userStore = new InMemoryUserStore(User)
    const taskStore = new InMemoryTaskStore()
    const gatheringStore = new InMemoryGatheringStore(Gathering)

    const makeTribe = async (n = 6) => {
        const tribe = await tribeStore.save(
            new Tribe({
                name: 'Foo tribe',
            })
        )
        const members = await memberStore.saveBulk(
            new Array(n).fill(0).map(
                (_, i) =>
                    new Member({
                        tribeId: tribe.id,
                        userId: `user${i}.id`,
                    })
            )
        )
        return { tribe, members }
    }
    const makeIdea = async (
        ups = [1, 3, 4, 6],
        downs = [2, 5],
        neutrals: number[] = []
    ) => {
        const tribeSize = ups.length + downs.length + neutrals.length + 1
        const { tribe, members } = await makeTribe(tribeSize)
        const brainstorm = await brainstormStore.save(
            new Brainstorm({
                tribeId: tribe.id,
                state: 'voting',
            })
        )
        const idea = await ideaStore.save(
            new QuestIdea({
                brainstormId: brainstorm.id,
                description: 'let us FOOO!',
                meberId: members[0].id,
            })
        )
        ups.forEach((i) => idea.voteUp(members[i].id))
        downs.forEach((i) => idea.voteDown(members[i].id))
        const upvoters = ups.map((i) => members[i].id)
        const downvoters = downs.map((i) => members[i].id)
        const allTribe = members.map((m) => m.id)

        return { tribe, members, idea, upvoters, downvoters, allTribe }
    }
    const testing = {
        spyOnMessage: makeMessageSpy(notififcationBus),
        makeTribe,
        makeIdea,
    }

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
