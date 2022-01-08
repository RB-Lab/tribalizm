import { ApplicationMessage, TribeApplication } from '../use-cases/apply-tribe'
import { IApplication } from '../use-cases/entities/application'
import { Member, SavedMember } from '../use-cases/entities/member'
import {
    InitiationQuest,
    QuestStatus,
    QuestType,
} from '../use-cases/entities/quest'
import { Tribe } from '../use-cases/entities/tribe'
import { User } from '../use-cases/entities/user'
import { createContext } from './test-context'

describe('Stranger application', () => {
    it('notifies target tribe member', async () => {
        const world = await setUp()
        const onApplication = jasmine.createSpy('onApplication')
        world.notificationBus.subscribe<ApplicationMessage>(
            'application-message',
            onApplication
        )
        await world.tribeApplication.applyToTribe(world.defReq)

        expect(onApplication).toHaveBeenCalledTimes(1)
        expect(onApplication).toHaveBeenCalledWith(
            jasmine.objectContaining<ApplicationMessage>({
                type: 'application-message',
                payload: {
                    targetUserId: jasmine.any(String),
                    questId: jasmine.any(String),
                },
            })
        )
    })

    it('stores properly initialized application', async () => {
        const world = await setUp()
        await world.tribeApplication.applyToTribe(world.defReq)
        const savedApp = await world.applicationStore._last()
        expect(savedApp).toEqual(
            jasmine.objectContaining<IApplication>({
                coverLetter: world.defReq.coverLetter,
                status: 'in-progress',
                approvedIds: [],
                // values checked below
                memberId: jasmine.any(String),
                currentElderId: jasmine.any(String),
                elderIds: jasmine.any(Array),
            })
        )
    })

    it('allocates three members for initiation', async () => {
        const world = await setUp()

        await world.tribeApplication.applyToTribe(world.defReq)
        const app = await world.applicationStore._last()

        const oldies = world.members.map((m) => m.id)
        expect(3).toBeLessThan(oldies.length)
        expect(app.elderIds.length).toBe(3)
        app.elderIds.forEach((id) => {
            expect(oldies.includes(id)).toBe(true)
        })
    })
    it('allocates all tribe members if it is less than 3', async () => {
        const world = await setUp()
        const tribe = await world.tribeStore.save(
            new Tribe({
                name: 'Bar tribe',
            })
        )
        const users = await world.userStore.saveBulk([
            new User({ name: 'user-1' }),
            new User({ name: 'user-2' }),
        ])
        const memberTemplate = { tribeId: tribe.id, isCandidate: false }
        const members = await world.memberStore.saveBulk([
            new Member({ ...memberTemplate, userId: users[0].id }),
            new Member({ ...memberTemplate, userId: users[1].id }),
        ])
        await world.tribeApplication.applyToTribe({
            ...world.defReq,
            tribeId: tribe.id,
        })
        const app = await world.applicationStore._last()

        const oldies = members.map((m) => m.id)
        expect(app.elderIds).toEqual(jasmine.arrayWithExactContents(oldies))
    })

    it('makes one of the oldies current', async () => {
        const world = await setUp()

        await world.tribeApplication.applyToTribe(world.defReq)
        const app = await world.applicationStore._last()
        expect(app.elderIds.includes(app.currentElderId)).toBe(true)
    })

    it('creates an initiation quest', async () => {
        const world = await setUp()

        await world.tribeApplication.applyToTribe(world.defReq)
        const quest = await world.questStore._last()
        const app = await world.applicationStore._last()

        expect(quest).toEqual(
            jasmine.objectContaining<InitiationQuest>({
                type: QuestType.initiation,
                status: QuestStatus.proposed,
                applicationId: app!.id,
                memberIds: jasmine.arrayContaining([app!.memberId]),
            })
        )
        expect(quest.memberIds.length).toBe(2)
    })

    it('creates a new member candidate', async () => {
        const world = await setUp()

        await world.tribeApplication.applyToTribe(world.defReq)
        const app = await world.applicationStore._last()
        const members = await world.memberStore.findSimple({
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
    const { tribe, members } = await context.testing.makeTribe()

    const user = await context.stores.userStore.save(
        new User({ name: 'Newbie' })
    )
    const defReq = {
        userId: user.id,
        tribeId: tribe.id,
        coverLetter: 'I want to FOO!',
    }

    const tribeApplication = new TribeApplication(context)
    return {
        tribe,
        user,
        members,
        defReq,
        ...context.stores,
        ...context.async,
        tribeApplication,
    }
}
