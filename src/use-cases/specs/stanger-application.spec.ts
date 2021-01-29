import {
    TribeApplication,
    ApplicationMessageType,
    ApplicationMessage,
} from '../apply-tribe'
import {
    Application,
    ApplicationPhase,
    ApplicationStore,
    SavedApplication,
} from '../entities/application'
import { Coordinates } from '../entities/location'
import { Member, MembersStore, SavedMember } from '../entities/member'
import { EntityNotFound } from '../entities/not-found-error'
import { NotificationBus } from '../entities/notification-bus'
import { QuestsStore } from '../entities/quest'
import { SavedTribe, Tribe, TribeStore } from '../entities/tribe'
import { SavedUser, User, UserStore } from '../entities/user'

describe('Stranger application', () => {
    it('should be created with target tribe and cover letter', async () => {
        const world = setUp()
        await world.tribeApplication.appyToTribe(userId, tribeId, coverLetter)
        expect(world.applicationStore.save).toHaveBeenCalled()
        // TODO refactor test to use  jasmine.objectContaining instead of calls.argsFor
        const appToSave = world.applicationStore.save.calls.argsFor(0)[0]
        expect(appToSave.coverLetter).toEqual(coverLetter)
        expect(appToSave.tribeId).toEqual(tribeId)
    })
    it('works with proper user', async () => {
        const world = setUp()
        await world.tribeApplication.appyToTribe(userId, tribeId, coverLetter)
        expect(world.userStore.getById).toHaveBeenCalledWith(userId)
    })
    it('should throw if user not found', async () => {
        const world = setUp()
        world.userStore.getById.and.resolveTo(null)
        await expectAsync(
            world.tribeApplication.appyToTribe(userId, tribeId, coverLetter)
        ).toBeRejectedWithError(EntityNotFound)
    })
    it('works with proper tribe', async () => {
        const world = setUp()
        await world.tribeApplication.appyToTribe(userId, tribeId, coverLetter)
        expect(world.tribseStore.getById).toHaveBeenCalledWith(tribeId)
    })
    it('should throw if tribe not found', async () => {
        const world = setUp()
        world.tribseStore.getById.and.resolveTo(null)
        await expectAsync(
            world.tribeApplication.appyToTribe(userId, tribeId, coverLetter)
        ).toBeRejectedWithError(EntityNotFound)
    })
    it('works with proper tribe chief', async () => {
        const world = setUp()
        await world.tribeApplication.appyToTribe(userId, tribeId, coverLetter)
        expect(world.memberStore.getById).toHaveBeenCalledWith(
            world.tribe.chiefId
        )
    })
    it('should throw if tribe chief not found', async () => {
        const world = setUp()
        world.memberStore.getById.and.resolveTo(null)
        await expectAsync(
            world.tribeApplication.appyToTribe(userId, tribeId, coverLetter)
        ).toBeRejectedWithError(EntityNotFound)
        // check that we tried to find chief
        expect(world.memberStore.getById).toHaveBeenCalledWith(
            world.tribe.chiefId
        )
    })

    it('starts application in "initial" phase', async () => {
        const world = setUp()
        await world.tribeApplication.appyToTribe(userId, tribeId, coverLetter)
        expect(world.applicationStore.save).toHaveBeenCalled()
        const appToSave = world.applicationStore.save.calls.argsFor(0)[0]
        expect(appToSave.phase).toEqual(ApplicationPhase.initial)
    })
    it('must notify target tribe chief', async () => {
        const world = setUp()
        world.memberStore.getById.and.resolveTo({
            id: world.tribe.chiefId,
        } as SavedMember)
        await world.tribeApplication.appyToTribe(userId, tribeId, coverLetter)
        expect(world.notififcationBus.notify).toHaveBeenCalledWith(
            jasmine.objectContaining<ApplicationMessage>({
                type: ApplicationMessageType,
                payload: jasmine.objectContaining<
                    ApplicationMessage['payload']
                >({
                    coverLetter,
                    elderId: world.tribe.chiefId,
                    applicationId: world.application.id,
                    userName: world.user.name,
                }),
            })
        )
    })
    it('assings elder to chief', async () => {
        const world = setUp()
        world.memberStore.getById.and.resolveTo({
            id: world.tribe.chiefId,
        } as SavedMember)
        await world.tribeApplication.appyToTribe(userId, tribeId, coverLetter)
        const appToSave = world.applicationStore.save.calls.argsFor(0)[0]
        expect(appToSave.elderId).toEqual(world.tribe.chiefId)
    })
    it('creates a new member candidate', async () => {
        const world = setUp()
        const newMemberFake = { id: 'new-member' } as SavedMember
        world.memberStore.save.and.resolveTo(newMemberFake)
        await world.tribeApplication.appyToTribe(userId, tribeId, coverLetter)
        expect(world.memberStore.save).toHaveBeenCalled()
        const memberToSave = world.memberStore.save.calls.argsFor(0)[0]
        expect(memberToSave.userId).toEqual(world.user.id)
        expect(memberToSave.isCandidate).toBe(true)
        expect(memberToSave.tribeId).toBe(world.tribe.id)
        const appToSave = world.applicationStore.save.calls.argsFor(0)[0]
        expect(appToSave.memberId).toEqual(newMemberFake.id)
    })
})

const userId = 'user-1'
const tribeId = 'tribe-1'
const coverLetter = 'I want to foo!'
export function setUp() {
    const tribe = new Tribe({
        id: tribeId,
        name: 'FooTribe',
        chiefId: 'chief',
        shamanId: 'shaman',
    }) as SavedTribe
    const application = new Application({
        id: 'a-foo',
        tribeId: tribe.id,
        memberId: 'new-member',
        coverLetter,
    }) as SavedApplication
    const user = new User({
        id: userId,
        name: 'Awesomnius Tribe',
        coordinates: {} as Coordinates,
    }) as SavedUser
    const userStore = jasmine.createSpyObj<UserStore>('UserStore', {
        getById: Promise.resolve(user),
    })
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
    const tribseStore = jasmine.createSpyObj<TribeStore>({
        find: Promise.resolve([]),
        getById: Promise.resolve(tribe),
    })

    const member = new Member({
        id: 'm-1',
        tribeId: tribe.id,
        userId: userId,
    }) as SavedMember
    const memberStore = jasmine.createSpyObj<MembersStore>('MembersStore', {
        getById: Promise.resolve(member),
        save: Promise.resolve(member),
    })
    const questStore = jasmine.createSpyObj<QuestsStore>('QuestsStore', [
        'save',
    ])

    const tribeApplication = new TribeApplication(
        notififcationBus,
        applicationStore,
        tribseStore,
        memberStore,
        userStore,
        questStore
    )
    return {
        user,
        member,
        userStore,
        tribe,
        tribseStore,
        memberStore,
        applicationStore,
        notififcationBus,
        application,
        tribeApplication,
    }
}
