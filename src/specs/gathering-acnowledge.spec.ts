import { Gathering } from '../use-cases/entities/gathering'
import { Member } from '../use-cases/entities/member'
import { Tribe } from '../use-cases/entities/tribe'
import {
    GateringAcknowledge,
    NotYourTribe,
} from '../use-cases/gathering-acknowledge'
import { createContext } from './test-context'

describe('Gathering acknowledgement', () => {
    it('marks member as accepted', async () => {
        const world = await setUp()
        await world.gatheringAck.accept({
            memberId: world.members[0].id,
            gatheringId: world.gathering.id,
        })
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
    it('FAILs to acknoledge if member is not listed in members')
    it('marks member as declined')
    it('FAILs to decline if member declared gathering')
    it('removes declined from accepted (switch opinion)')
    it('removes accepted from declined (switch opinion)')
})

async function setUp() {
    const context = createContext()
    const gatheringAck = new GateringAcknowledge(context)

    const tribe = await context.stores.tribeStore.save(
        new Tribe({
            name: 'Foo tribe',
        })
    )
    const members = await context.stores.memberStore.saveBulk(
        [0, 1, 2, 3, 4, 5, 6].map(
            (i) => new Member({ tribeId: tribe.id, userId: `user${i}.id` })
        )
    )
    const gathering = await context.stores.gatheringStore.save(
        new Gathering({
            tribeId: tribe.id,
            description: 'Lets OLOLO!',
            place: 'the Foo Bar',
            time: 100500500,
            type: 'all',
        })
    )

    return {
        ...context.stores,
        members,
        gathering,
        gatheringAck,
    }
}
