import {
    ElderMismatchError,
    InitiationRequest,
    NoElderSetError,
    QuestMessage,
    QuestMessageType,
    TribeApplication,
} from '../apply-tribe'
import { ApplicationPhase, IApplication } from '../entities/application'
import { IQuest, QuestStatus, QuestType } from '../entities/quest'
import { chiefId, createContext } from './test-context'

describe('Initiation quests', () => {
    it('transfers application to "chiefInitiation" phase', async () => {
        const world = await setUp()
        await world.tribeApplication.startInitiation(world.defaultRequest)
        expect(world.applicationStore.save).toHaveBeenCalledWith(
            jasmine.objectContaining<IApplication>({
                phase: ApplicationPhase.chiefInitiation,
            })
        )
    })
    it('works with proper application', async () => {
        const world = await setUp()
        await world.tribeApplication.startInitiation(world.defaultRequest)
        expect(world.applicationStore.getById).toHaveBeenCalledWith(
            world.application.id
        )
    })
    describe("doesn't allow to", () => {
        it('start initiation without elder', async () => {
            const world = await setUp()
            world.applicationStore.getById.and.resolveTo({
                ...world.application,
                elderId: null,
            })
            await expectAsync(
                world.tribeApplication.startInitiation(world.defaultRequest)
            ).toBeRejectedWithError(NoElderSetError)
        })
        it('initiate with improper elder', async () => {
            const world = await setUp()
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
        const world = await setUp()
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
        const world = await setUp()
        await world.tribeApplication.startInitiation(world.defaultRequest)
        expect(world.notififcationBus.notify).toHaveBeenCalledWith(
            jasmine.objectContaining<QuestMessage>({
                type: QuestMessageType,
                payload: jasmine.objectContaining<QuestMessage['payload']>({
                    targetId: world.application.memberId,
                    questId: jasmine.any(String),
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

async function setUp(world: { elder: string } = { elder: chiefId }) {
    const context = createContext(world)
    const application = await context.stores.applicationStore.getById(
        'whatever'
    )
    const defaultRequest: InitiationRequest = {
        applicationId: application!.id,
        memberId: chiefId,
        place: 'The Foo Bar',
        time: 1_700_100_500_000,
    }

    const tribeApplication = new TribeApplication(context)
    return {
        defaultRequest,
        applicationStore: context.stores.applicationStore,
        notififcationBus: context.async.notififcationBus,
        questStore: context.stores.questStore,
        application: application!,
        tribeApplication,
    }
}
