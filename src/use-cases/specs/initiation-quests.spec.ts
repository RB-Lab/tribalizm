import {
    ElderMismatchError,
    InitiationRequest,
    NoElderSetError,
    QuestMessage,
    QuestMessageType,
    TribeApplication,
} from '../apply-tribe'
import { Application, ApplicationPhase } from '../entities/application'
import { Member } from '../entities/member'
import { IQuest, QuestStatus, QuestType } from '../entities/quest'
import { Tribe } from '../entities/tribe'
import { createContext } from './test-context'

describe('Initiation quests', () => {
    it('transfers application to "chiefInitiation" phase', async () => {
        const world = await setUp()
        await world.tribeApplication.startInitiation(world.defaultRequest)
        const app = await world.applicationStore.getById(
            world.defaultRequest.applicationId
        )
        expect(app?.phase).toEqual(ApplicationPhase.chiefInitiation)
    })
    describe("doesn't allow to", () => {
        it('start initiation without elder', async () => {
            const world = await setUp()
            const badApp = await world.applicationStore.save(
                new Application({
                    coverLetter: world.application.coverLetter,
                    memberId: world.application.memberId,
                    tribeId: world.application.tribeId,
                })
            )
            await expectAsync(
                world.tribeApplication.startInitiation({
                    ...world.defaultRequest,
                    applicationId: badApp.id,
                })
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
    it('notifies a member on initiaition quest', async () => {
        const world = await setUp()
        const onQuest = jasmine.createSpy('onQuest')
        world.notififcationBus.subscribe(QuestMessageType, onQuest)
        await world.tribeApplication.startInitiation(world.defaultRequest)
        expect(onQuest).toHaveBeenCalledWith(
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
    it('fires an initiation quest', async () => {
        const world = await setUp()
        await world.tribeApplication.startInitiation(world.defaultRequest)

        world.notififcationBus.subscribe<QuestMessage>(
            QuestMessageType,
            async (message) => {
                const quest = await world.questStore.getById(
                    message.payload.questId
                )
                expect(quest).toEqual(
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
            }
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

async function setUp() {
    const context = createContext()
    const tribe = await context.stores.tribeStore.save(
        new Tribe({
            name: 'Foo Tribe',
        })
    )
    const [newMember, chief] = await context.stores.memberStore.saveBulk([
        new Member({
            tribeId: tribe.id,
            userId: 'new-user',
        }),
        new Member({
            tribeId: tribe.id,
            userId: 'chief-user',
        }),
    ])
    const application = await context.stores.applicationStore.save(
        new Application({
            coverLetter: 'I want to FOO!',
            memberId: newMember.id,
            tribeId: tribe.id,
            elderId: chief.id,
        })
    )
    const defaultRequest: InitiationRequest = {
        applicationId: application.id,
        memberId: chief.id,
        place: 'The Foo Bar',
        time: 1_700_100_500_000,
    }

    const tribeApplication = new TribeApplication(context)
    return {
        newMember,
        chief,
        defaultRequest,
        application,
        tribeApplication,
        ...context.async,
        ...context.stores,
    }
}
