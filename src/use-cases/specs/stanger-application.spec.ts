import {
    ApplicationMessage,
    ApplicationMessageType,
    NoChiefTribeError,
    TribeApplication,
} from '../apply-tribe'
import { ApplicationPhase, SavedApplication } from '../entities/application'
import { Coordinates } from '../entities/location'
import { Member, SavedMember } from '../entities/member'
import { EntityNotFound } from '../entities/not-found-error'
import { Tribe } from '../entities/tribe'
import { User } from '../entities/user'
import { createContext } from './test-context'

const coverLetter = 'I want to FOO!'
describe('Stranger application', () => {
    it('must notify target tribe chief', async () => {
        const world = await setUp()
        const onApplication = jasmine.createSpy('onApplication')
        world.notififcationBus.subscribe<ApplicationMessage>(
            'application-message',
            onApplication
        )
        const app = await world.tribeApplication.appyToTribe(
            world.user.id,
            world.tribe.id,
            coverLetter
        )

        expect(onApplication).toHaveBeenCalledTimes(1)
        expect(onApplication).toHaveBeenCalledWith(
            jasmine.objectContaining<ApplicationMessage>({
                type: ApplicationMessageType,
                payload: {
                    coverLetter,
                    elderId: world.tribe.chiefId!,
                    applicationId: app.id,
                    userName: world.user.name,
                },
            })
        )
    })
    it('should store properly initialized application', async () => {
        const world = await setUp()
        const coverLetter = 'I want to FOO!'
        const app = await world.tribeApplication.appyToTribe(
            world.user.id,
            world.tribe.id,
            coverLetter
        )
        const savedApp = await world.applicationStore.getById(app.id)
        expect(savedApp).toEqual(
            jasmine.objectContaining<SavedApplication>({
                coverLetter,
                tribeId: world.tribe.id,
                chiefId: world.tribe.chiefId,
                phase: ApplicationPhase.initial,
            })
        )
    })

    it('should throw if user not found', async () => {
        const world = await setUp()
        await expectAsync(
            world.tribeApplication.appyToTribe(
                'boobooboo',
                world.tribe.id,
                coverLetter
            )
        ).toBeRejectedWithError(EntityNotFound)
    })

    it('should throw if tribe not found', async () => {
        const world = await setUp()
        await expectAsync(
            world.tribeApplication.appyToTribe(
                world.user.id,
                'boobooboo',
                coverLetter
            )
        ).toBeRejectedWithError(EntityNotFound)
    })
    it('should throw if tribe have no chief', async () => {
        const world = await setUp()
        const tribe = await world.tribeStore.save(new Tribe({ name: 'tribe' }))
        await expectAsync(
            world.tribeApplication.appyToTribe(
                world.user.id,
                tribe.id,
                coverLetter
            )
        ).toBeRejectedWithError(NoChiefTribeError)
    })
    it('should throw if tribe chief not found', async () => {
        const world = await setUp()
        const tribe = await world.tribeStore.save(
            new Tribe({ name: 'tribe', chiefId: 'non-existing' })
        )
        await expectAsync(
            world.tribeApplication.appyToTribe(
                world.user.id,
                tribe.id,
                coverLetter
            )
        ).toBeRejectedWithError(EntityNotFound)
    })

    it('creates a new member candidate', async () => {
        const world = await setUp()

        const app = await world.tribeApplication.appyToTribe(
            world.user.id,
            world.tribe.id,
            coverLetter
        )
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
        expect(app.memberId).toBe(members[0].id)
    })
})

async function setUp() {
    const context = createContext()
    const tribeId = 'whatever-tribe-id'
    const [chief, shaman] = await context.stores.memberStore.saveBulk([
        new Member({
            tribeId: tribeId,
            userId: 'non-existing',
        }),
        new Member({
            tribeId: tribeId,
            userId: 'non-existing-2',
        }),
    ])
    const tribe = await context.stores.tribeStore.save(
        new Tribe({
            id: tribeId,
            name: 'FooTribe',
            chiefId: chief.id,
            shamanId: shaman.id,
        })
    )

    const user = await context.stores.userStore.save(
        new User({
            name: 'Userus Tribe',
            coordinates: {} as Coordinates,
        })
    )

    const tribeApplication = new TribeApplication(context)
    return {
        tribe: tribe,
        user: user,
        ...context.stores,
        ...context.async,
        tribeApplication,
    }
}
