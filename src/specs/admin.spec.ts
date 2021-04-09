import { Admin, AlreadyHaveChief, TimeToStormMessage } from '../use-cases/admin'
import { Tribe, TribeType } from '../use-cases/entities/tribe'
import { User } from '../use-cases/entities/user'
import { createContext } from './test-context'

describe('Admin', () => {
    it('creates a new tribe', async () => {
        const world = await setUp()
        const req = {
            name: 'ololo ligue',
            cityId: 'city-42',
            logo: 'bar.png',
            vocabulary: TribeType.league,
        }
        await world.admin.createTribe(req)
        const tribe = await world.tribeStore._last()
        expect(tribe).toEqual(jasmine.objectContaining(req))
    })
    it('adds a member to a tribe', async () => {
        const world = await setUp()
        const { user, tribe } = await world.makeUserAndTribe()
        await world.admin.addTribeMemer({
            tribeId: tribe.id,
            userId: user.id,
        })
        const members = await world.memberStore.find({ tribeId: tribe.id })
        expect(members.length).toBe(1)
        expect(members[0].userId).toBe(user.id)
    })
    it('marks first member as tribe chief & shaman', async () => {
        const world = await setUp()
        const { user, tribe } = await world.makeUserAndTribe()
        const member = await world.admin.addTribeMemer({
            tribeId: tribe.id,
            userId: user.id,
        })
        const tribeAfter = await world.tribeStore.getById(tribe.id)
        expect(tribeAfter!.chiefId).toBe(member.id)
        expect(tribeAfter!.shamanId).toBe(member.id)
        expect(member.charisma).toBeGreaterThan(0)
    })
    it('FAILs to add second member', async () => {
        const world = await setUp()
        const { user, tribe } = await world.makeUserAndTribe()
        const { user: user2 } = await world.makeUserAndTribe()
        await world.admin.addTribeMemer({
            tribeId: tribe.id,
            userId: user.id,
        })
        await expectAsync(
            world.admin.addTribeMemer({
                tribeId: tribe.id,
                userId: user2.id,
            })
        ).toBeRejectedWithError(AlreadyHaveChief)
    })
    it('notifies chief about a brainstorm', async () => {
        const world = await setUp()
        const onMessage = world.spyOnMessage<TimeToStormMessage>(
            'time-to-storm'
        )
        await world.admin.notifyBrainstorm({ memberId: 'member' })
        expect(onMessage).toHaveBeenCalledOnceWith(
            jasmine.objectContaining<TimeToStormMessage>({
                type: 'time-to-storm',
                payload: {
                    targetMemberId: 'member',
                },
            })
        )
    })
})

async function setUp() {
    const context = createContext()

    const admin = new Admin(context)
    const makeUserAndTribe = async () => {
        const user = await context.stores.userStore.save(
            new User({
                name: 'unnamed',
            })
        )
        const tribe = await context.stores.tribeStore.save(
            new Tribe({
                name: 'olol',
                cityId: 'spb',
            })
        )
        return { user, tribe }
    }

    return {
        admin,
        makeUserAndTribe,
        ...context.stores,
        spyOnMessage: context.testing.spyOnMessage,
    }
}
