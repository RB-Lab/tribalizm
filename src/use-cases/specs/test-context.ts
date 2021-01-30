import {
    Application,
    ApplicationStore,
    SavedApplication,
} from '../entities/application'
import {
    Brainstorm,
    BrainstormStore,
    IdeaStore,
    QuestIdea,
} from '../entities/brainstorm'
import { Coordinates } from '../entities/location'
import { Member, MembersStore, SavedMember } from '../entities/member'
import { QuestStore, QuestType, SavedQuest } from '../entities/quest'
import { SavedTribe, Tribe, TribeStore } from '../entities/tribe'
import { SavedUser, User, UserStore } from '../entities/user'
import { NotificationBus } from '../notification-bus'

export const tribeId = 'tribe-1'
export const userId = 'user-1'
export const chiefId = 'chief'
export const shamanId = 'shaman'
export const questId = 'quest-id'
export const coverLetter = 'I want to foo!'

export function createContext(world: { elder: string } = { elder: chiefId }) {
    const application = new Application({
        id: 'a-foo',
        tribeId: tribeId,
        memberId: 'new-member',
        coverLetter,
        elderId: world.elder,
    }) as SavedApplication

    const user = new User({
        id: userId,
        name: 'Userus Tribe',
        coordinates: {} as Coordinates,
    }) as SavedUser
    const tribe = new Tribe({
        id: tribeId,
        name: 'FooTribe',
        chiefId,
        shamanId,
    }) as SavedTribe
    const member = new Member({
        id: 'member-id',
        tribeId: tribe.id,
        userId: user.id,
    }) as SavedMember
    const tribeStore = jasmine.createSpyObj<TribeStore>({
        find: Promise.resolve([]),
        getById: Promise.resolve(tribe),
    })
    const userStore = jasmine.createSpyObj<UserStore>('UserStore', {
        getById: Promise.resolve(user),
    })
    const memberStore = jasmine.createSpyObj<MembersStore>('MembersStore', {
        find: Promise.resolve([]),
        save: Promise.resolve(member),
        getById: Promise.resolve(member),
    })
    const quest = {
        id: questId,
        type: QuestType.initiation,
    } as SavedQuest

    const questStore = jasmine.createSpyObj<QuestStore>('QuestsStore', {
        save: Promise.resolve(quest),
        saveBulk: Promise.resolve([]),
        getActiveQuestsCount: Promise.resolve({ [member.id]: 0 }),
    })
    const brainstorm = new Brainstorm({ id: 'foo', tribeId: tribe.id })
    const idea = new QuestIdea({
        id: `i-42`,
        meberId: member.id,
        brainstormId: brainstorm.id,
        description: `desc i-42`,
    })

    const applicationStore = jasmine.createSpyObj<ApplicationStore>(
        'ApplicationStore',
        {
            save: Promise.resolve(application),
            getById: Promise.resolve(application),
        }
    )
    const ideasStore = jasmine.createSpyObj<IdeaStore>('IdeasStore', {
        getById: Promise.resolve(idea),
        find: Promise.resolve([]),
        save: Promise.resolve(idea),
        saveBulk: Promise.resolve([]),
    })
    const brainstormStore = jasmine.createSpyObj<BrainstormStore>(
        'BrainstormStore',
        {
            getById: Promise.resolve(brainstorm),
            save: Promise.resolve(brainstorm),
        }
    )
    const notififcationBus = jasmine.createSpyObj<NotificationBus>(
        'NotificationBus',
        ['notify']
    )

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
