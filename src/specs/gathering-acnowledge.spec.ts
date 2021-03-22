import { Gathering } from '../use-cases/entities/gathering'
import { Member } from '../use-cases/entities/member'
import { GateringAcknowledge } from '../use-cases/gathering-acknowledge'
import { NotYourTribe } from '../use-cases/utils/not-your-tribe'
import { createContext } from './test-context'

describe('Gathering acknowledgement', () => {
    it('marks member as accepted', async () => {
        const world = await setUp()
        await world.gatheringAck.accept(world.defaultReq)
        const gathering = await world.gatheringStore.getById(world.gathering.id)
        expect(gathering!.accepted).toContain(world.members[0].id)
    })
    it('FAILs to acknoledge if member is from different tribe', async () => {
        const world = await setUp()
        const anotherMember = await world.memberStore.save(
            new Member({
                tribeId: 'another-tirbe',
                userId: 'user',
            })
        )
        await expectAsync(
            world.gatheringAck.accept({
                memberId: anotherMember.id,
                gatheringId: world.gathering.id,
            })
        ).toBeRejectedWithError(NotYourTribe)
    })
    it('marks member as declined', async () => {
        const world = await setUp()
        await world.gatheringAck.decline(world.defaultReq)
        const gathering = await world.gatheringStore.getById(world.gathering.id)
        expect(gathering!.declined).toContain(world.members[0].id)
    })
    it('removes declined from accepted (switch opinion)', async () => {
        const world = await setUp()
        await world.gatheringAck.decline(world.defaultReq)
        await world.gatheringAck.accept(world.defaultReq)
        const gathering = await world.gatheringStore.getById(world.gathering.id)
        expect(gathering!.declined).not.toContain(world.members[0].id)
        expect(gathering!.accepted).toContain(world.members[0].id)
    })
    it('removes accepted from declined (switch opinion)', async () => {
        const world = await setUp()
        await world.gatheringAck.accept(world.defaultReq)
        await world.gatheringAck.decline(world.defaultReq)
        const gathering = await world.gatheringStore.getById(world.gathering.id)
        expect(gathering!.accepted).not.toContain(world.members[0].id)
        expect(gathering!.declined).toContain(world.members[0].id)
    })
})

async function setUp() {
    const context = createContext()
    const gatheringAck = new GateringAcknowledge(context)

    const { tribe, members } = await context.testing.makeTribe()
    const gathering = await context.stores.gatheringStore.save(
        new Gathering({
            tribeId: tribe.id,
            parentQuestId: 'quest-1',
            description: 'Lets OLOLO!',
            place: 'the Foo Bar',
            time: 100500500,
            type: 'all',
        })
    )
    const defaultReq = {
        memberId: members[0].id,
        gatheringId: gathering.id,
    }

    return {
        ...context.stores,
        members,
        gathering,
        gatheringAck,
        defaultReq,
    }
}
