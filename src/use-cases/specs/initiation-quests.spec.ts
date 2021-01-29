import {
    ElderMismatchError,
    InitiationRequest,
    NoElderSetError,
    QuestMessage,
    QuestMessageType,
    TribeApplication,
} from '../apply-tribe'
import {
    Application,
    ApplicationPhase,
    ApplicationStore,
    IApplication,
    SavedApplication,
} from '../entities/application'
import { MembersStore } from '../entities/member'
import { NotificationBus } from '../entities/notification-bus'
import {
    IQuest,
    QuestsStore,
    QuestStatus,
    QuestType,
    SavedQuest,
} from '../entities/quest'
import { SavedTribe, Tribe, TribeStore } from '../entities/tribe'
import { UserStore } from '../entities/user'

describe('Initiation quests', () => {
    it('transfers application to "chiefInitiation" phase', async () => {
        const world = setUp()
        await world.tribeApplication.startInitiation(world.defaultRequest)
        expect(world.applicationStore.save).toHaveBeenCalledWith(
            jasmine.objectContaining<IApplication>({
                phase: ApplicationPhase.chiefInitiation,
            })
        )
    })
    it('works with proper application', async () => {
        const world = setUp()
        await world.tribeApplication.startInitiation(world.defaultRequest)
        expect(world.applicationStore.getById).toHaveBeenCalledWith(
            world.application.id
        )
    })
    describe("doesn't allow to", () => {
        it('start initiation without elder', async () => {
            const world = setUp()
            world.applicationStore.getById.and.resolveTo({
                ...world.application,
                elderId: null,
            })
            await expectAsync(
                world.tribeApplication.startInitiation(world.defaultRequest)
            ).toBeRejectedWithError(NoElderSetError)
        })
        it('initiate with improper elder', async () => {
            const world = setUp()
            await expectAsync(
                world.tribeApplication.startInitiation({
                    ...world.defaultRequest,
                    memberId: 'imporoper-elder-id',
                })
            ).toBeRejectedWithError(ElderMismatchError)
        })
        // it('start "chiefInitiation" from "shamanInitiation" phase')
        // it('start "shamanInitiation" from "initial" phase')
        // it('finallize from "initial" phase')
        // it('finallize from "chiefInitiation" phase')
    })
    it('fires an initiation quest', async () => {
        const world = setUp()
        await world.tribeApplication.startInitiation(world.defaultRequest)
        expect(world.questStore.save).toHaveBeenCalledWith(
            jasmine.objectContaining<IQuest>({
                type: QuestType.initiation,
                status: QuestStatus.proposed,
                date: world.defaultRequest.time,
                place: world.defaultRequest.place,
                memberIds: jasmine.arrayContaining([
                    world.defaultRequest.memberId,
                    world.application.memberId,
                ]),
            })
        )
    })
    it('notifies a member on initiaition quest', async () => {
        const world = setUp()
        await world.tribeApplication.startInitiation(world.defaultRequest)
        expect(world.notififcationBus.notify).toHaveBeenCalledWith(
            jasmine.objectContaining<QuestMessage>({
                type: QuestMessageType,
                payload: jasmine.objectContaining<QuestMessage['payload']>({
                    targetId: world.application.memberId,
                    questId,
                    questType: QuestType.initiation,
                    time: world.defaultRequest.time,
                    place: world.defaultRequest.place,
                }),
            })
        )
    })
    // it('transfers approved application to shaman')
    // it('works with proper tribe shaman')
    // it('should skip shaman phase if tribe has no shaman')

    // it('transfers application to "shamanInitiation" phase')
    // it('finalizes declined application')
    // it('makes a full-fledged member after two approvals')
    // it('notifies a member on their approval')
})

const tribeId = 'tribe-1'
const chiefId = 'chief'
const shamanId = 'shaman'
const questId = 'quest-id'
export function setUp(world: { elder: string } = { elder: chiefId }) {
    const application = new Application({
        id: 'a-foo',
        tribeId: tribeId,
        memberId: 'new-member',
        coverLetter: 'I want to foo!',
        elderId: world.elder,
    }) as SavedApplication
    const defaultRequest: InitiationRequest = {
        applicationId: application.id,
        memberId: chiefId,
        place: 'The Foo Bar',
        time: 1700100500000,
    }
    const applicationStore = jasmine.createSpyObj<ApplicationStore>(
        'ApplicationStore',
        {
            save: Promise.resolve(application),
            getById: Promise.resolve(application),
        }
    )
    const notififcationBus = jasmine.createSpyObj<NotificationBus>(
        'NotificationBus',
        ['notify']
    )

    const tribe = new Tribe({
        id: tribeId,
        name: 'FooTribe',
        chiefId,
        shamanId,
    }) as SavedTribe
    const tribseStore = jasmine.createSpyObj<TribeStore>({
        find: Promise.resolve([]),
        getById: Promise.resolve(tribe),
    })
    const memberStore = jasmine.createSpyObj<MembersStore>('MembersStore', [
        'find',
        'getById',
    ])
    const userStore = jasmine.createSpyObj<UserStore>('UserStore', ['getById'])

    const questStore = jasmine.createSpyObj<QuestsStore>('QuestsStore', {
        save: Promise.resolve({
            id: questId,
            type: QuestType.initiation,
        } as SavedQuest),
    })

    const tribeApplication = new TribeApplication(
        notififcationBus,
        applicationStore,
        tribseStore,
        memberStore,
        userStore,
        questStore
    )
    return {
        defaultRequest,
        tribe,
        applicationStore,
        notififcationBus,
        questStore,
        application,
        tribeApplication,
    }
}
