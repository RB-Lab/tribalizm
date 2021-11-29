import { ApplicationStore } from '../entities/application'
import { BrainstormStore, IdeaStore } from '../entities/brainstorm'
import { CityStore } from '../entities/city'
import { GatheringStore } from '../entities/gathering'
import { MemberStore } from '../entities/member'
import { QuestStore } from '../entities/quest'
import { TaskStore } from '../utils/scheduler'
import { TribeStore } from '../entities/tribe'
import { UserStore } from '../entities/user'
import { NotificationBus } from './notification-bus'

export interface Context {
    stores: {
        applicationStore: ApplicationStore
        tribeStore: TribeStore
        memberStore: MemberStore
        userStore: UserStore
        questStore: QuestStore
        ideaStore: IdeaStore
        brainstormStore: BrainstormStore
        taskStore: TaskStore
        gatheringStore: GatheringStore
        cityStore: CityStore
    }
    async: {
        notificationBus: NotificationBus
    }
}
