import {
    ApplicationMessage,
    ApplicationMessageType,
    TribeApplication,
} from '../apply-tribe'
import { ApplicationPhase } from '../entities/application'
import { SavedMember } from '../entities/member'
import { EntityNotFound } from '../entities/not-found-error'
import { coverLetter, createContext, tribeId, userId } from './test-context'

describe('Stranger application', () => {
    it('should be created with target tribe and cover letter', async () => {
        const world = await setUp()
        await world.tribeApplication.appyToTribe(userId, tribeId, coverLetter)
        expect(world.applicationStore.save).toHaveBeenCalled()
        // TODO refactor test to use  jasmine.objectContaining instead of calls.argsFor
        const appToSave = world.applicationStore.save.calls.argsFor(0)[0]
        expect(appToSave.coverLetter).toEqual(coverLetter)
        expect(appToSave.tribeId).toEqual(tribeId)
    })
    it('works with proper user', async () => {
        const world = await setUp()
        await world.tribeApplication.appyToTribe(userId, tribeId, coverLetter)
        expect(world.userStore.getById).toHaveBeenCalledWith(userId)
    })
    it('should throw if user not found', async () => {
        const world = await setUp()
        world.userStore.getById.and.resolveTo(null)
        await expectAsync(
            world.tribeApplication.appyToTribe(userId, tribeId, coverLetter)
        ).toBeRejectedWithError(EntityNotFound)
    })
    it('works with proper tribe', async () => {
        const world = await setUp()
        await world.tribeApplication.appyToTribe(userId, tribeId, coverLetter)
        expect(world.tribeStore.getById).toHaveBeenCalledWith(tribeId)
    })
    it('should throw if tribe not found', async () => {
        const world = await setUp()
        world.tribeStore.getById.and.resolveTo(null)
        await expectAsync(
            world.tribeApplication.appyToTribe(userId, tribeId, coverLetter)
        ).toBeRejectedWithError(EntityNotFound)
    })
    it('works with proper tribe chief', async () => {
        const world = await setUp()
        await world.tribeApplication.appyToTribe(userId, tribeId, coverLetter)
        expect(world.memberStore.getById).toHaveBeenCalledWith(
            world.tribe.chiefId
        )
    })
    it('should throw if tribe chief not found', async () => {
        const world = await setUp()
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
        const world = await setUp()
        await world.tribeApplication.appyToTribe(userId, tribeId, coverLetter)
        expect(world.applicationStore.save).toHaveBeenCalled()
        const appToSave = world.applicationStore.save.calls.argsFor(0)[0]
        expect(appToSave.phase).toEqual(ApplicationPhase.initial)
    })
    it('must notify target tribe chief', async () => {
        const world = await setUp()
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
        const world = await setUp()
        world.memberStore.getById.and.resolveTo({
            id: world.tribe.chiefId,
        } as SavedMember)
        await world.tribeApplication.appyToTribe(userId, tribeId, coverLetter)
        const appToSave = world.applicationStore.save.calls.argsFor(0)[0]
        expect(appToSave.elderId).toEqual(world.tribe.chiefId)
    })
    it('creates a new member candidate', async () => {
        const world = await setUp()
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
async function setUp(world: { elder: string } = { elder: 'chiefId' }) {
    const context = createContext(world)
    const application = await context.stores.applicationStore.getById(
        'whatever'
    )
    const tribe = await context.stores.tribeStore.getById('whatever')
    const user = await context.stores.userStore.getById('whatever')

    const tribeApplication = new TribeApplication(context)
    return {
        tribe: tribe!,
        user: user!,
        userStore: context.stores.userStore,
        tribeStore: context.stores.tribeStore,
        memberStore: context.stores.memberStore,
        applicationStore: context.stores.applicationStore,
        notififcationBus: context.async.notififcationBus,
        questStore: context.stores.questStore,
        application: application!,
        tribeApplication,
    }
}
