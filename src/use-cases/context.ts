import { ApplicationStore } from './entities/application'
import { BrainstormStore, IdeaStore } from './entities/brainstorm'
import { MembersStore } from './entities/member'
import { QuestStore } from './entities/quest'
import { TribeStore } from './entities/tribe'
import { UserStore } from './entities/user'
import { NotificationBus } from './notification-bus'

export interface Context {
    stores: {
        applicationStore: ApplicationStore
        tribeStore: TribeStore
        memberStore: MembersStore
        userStore: UserStore
        questStore: QuestStore
        ideasStore: IdeaStore
        brainstormStore: BrainstormStore
    }
    async: {
        notififcationBus: NotificationBus
    }
}