import {
    ApplicationMessage,
    NoChiefTribeError,
    TribeApplication,
} from '../use-cases/apply-tribe'
import {
    ApplicationPhase,
    IApplication,
} from '../use-cases/entities/application'
import { Coordinates } from '../use-cases/entities/location'
import { SavedMember } from '../use-cases/entities/member'
import { Tribe } from '../use-cases/entities/tribe'
import { User } from '../use-cases/entities/user'
import { createContext } from './test-context'

describe('Stranger application', () => {
    it('notifies target tribe chief', async () => {
        const world = await setUp()
        const onApplication = jasmine.createSpy('onApplication')
        world.notififcationBus.subscribe<ApplicationMessage>(
            'application-message',
            onApplication
        )
        await world.tribeApplication.appyToTribe(world.defReq)

        expect(onApplication).toHaveBeenCalledTimes(1)
        expect(onApplication).toHaveBeenCalledWith(
            jasmine.objectContaining<ApplicationMessage>({
                type: 'application-message',
                payload: {
                    elderUserId: world.chief.userId,
                    tribeName: world.tribe.name,
                    coverLetter: world.defReq.coverLetter,
                    applicationId: jasmine.any(String),
                    userName: world.user.name,
                },
            })
        )
    })
    it('stores properly initialized application', async () => {
        const world = await setUp()
        await world.tribeApplication.appyToTribe(world.defReq)
        const savedApp = await world.applicationStore._last()
        expect(savedApp).toEqual(
            jasmine.objectContaining<IApplication>({
                coverLetter: world.defReq.coverLetter,
                tribeId: world.tribe.id,
                chiefId: world.tribe.chiefId,
                phase: ApplicationPhase.initial,
            })
        )
    })

    it('FAILs if tribe have no chief', async () => {
        const world = await setUp()
        const tribe = await world.tribeStore.save(
            new Tribe({ name: 'tribe', cityId: 'city-42' })
        )
        await expectAsync(
            world.tribeApplication.appyToTribe({
                ...world.defReq,
                tribeId: tribe.id,
            })
        ).toBeRejectedWithError(NoChiefTribeError)
    })
    // TODO 🤔 make a common test on not found errors?
    it('creates a new member candidate', async () => {
        const world = await setUp()

        await world.tribeApplication.appyToTribe(world.defReq)
        const app = await world.applicationStore._last()
        const members = await world.memberStore.find({
            tribeId: world.tribe.id,
            userId: world.user.id,
        })
        expect(members.length).toBe(1)
        expect(members[0]).toEqual(
            jasmine.objectContaining<SavedMember>({
                userId: world.user.id,
                isCandidate: true,
                tribeId: world.tribe.id,
            })
        )
        expect(app?.memberId).toBe(members[0].id)
    })
})

async function setUp() {
    const context = await createContext()
    const { tribe } = await context.testing.makeTribe()

    const chief = await context.stores.memberStore.getById(tribe.chiefId!)
    const shaman = await context.stores.memberStore.getById(tribe.shamanId!)
    const user = await context.stores.userStore.save(
        new User({ name: 'Userus Tribe' })
    )
    const defReq = {
        userId: user.id,
        tribeId: tribe.id,
        coverLetter: 'I want to FOO!',
    }

    const tribeApplication = new TribeApplication(context)
    return {
        tribe,
        chief: chief!,
        shaman: shaman!,
        user,
        defReq,
        ...context.stores,
        ...context.async,
        tribeApplication,
    }
}
