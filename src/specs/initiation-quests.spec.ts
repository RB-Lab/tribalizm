import { TribeApplication } from '../use-cases/apply-tribe'
import { User } from '../use-cases/entities/user'
import {
    ApplicationDeclinedMessage,
    Initiation,
    InitiationRequest,
} from '../use-cases/initiation'
import { createContext, makeMessageSpy } from './test-context'

fdescribe('Initiation quests:', () => {
    describe('Decline', () => {
        it('finalizes declined application', async () => {
            const world = await setUp()
            await world.initiation.decline(world.initReq)
            const app = await world.applicationStore.getById(
                world.application.id
            )

            const member = await world.memberStore.getById(world.newMember.id)
            expect(app!.status).toEqual('declined')
            expect(member!.isCandidate)
                .withContext('member.isCandidate')
                .toEqual(true)
        })
        it('notifies non-member on application decline', async () => {
            const world = await setUp()
            const onDecline = world.spyOnMessage<ApplicationDeclinedMessage>(
                'application-declined'
            )

            await world.initiation.decline({
                ...world.initReq,
                userId: world.shaman.userId,
            })
            expect(onDecline).toHaveBeenCalledWith(
                jasmine.objectContaining<ApplicationDeclinedMessage>({
                    type: 'application-declined',
                    payload: {
                        targetMemberId: world.newMember.id,
                        targetUserId: world.user.id,
                        tribeName: world.tribe.name,
                    },
                })
            )
        })
    })
})

async function setUp() {
    const context = await createContext()
    const { members, tribe, users } = await context.testing.makeTribe()
    const [chief, shaman] = members
    const [chiefUser, shamanUser] = users
    await context.stores.tribeStore.save({
        ...tribe,
        chiefId: chief.id,
        shamanId: shaman.id,
    })
    const user = await context.stores.userStore.save(
        new User({
            name: 'New user',
        })
    )
    const tribeApp = new TribeApplication(context)
    await tribeApp.applyToTribe({
        coverLetter: 'foo',
        userId: user!.id,
        tribeId: tribe.id,
    })
    const application = await context.stores.applicationStore._last()
    const quest = await context.stores.questStore._last()
    const newMember = await context.stores.memberStore._last()
    const defaultInitiationRequest: InitiationRequest = {
        questId: quest!.id,
        userId: chief.userId,
    }

    const initiation = new Initiation(context)
    return {
        tribe,
        newMember,
        quest,
        users,
        members,
        user,
        chief,
        shaman,
        chiefUser,
        shamanUser,
        initReq: defaultInitiationRequest,
        application,
        initiation,
        ...context.async,
        ...context.stores,
        spyOnMessage: makeMessageSpy(context.async.notificationBus),
    }
}
