import {
    ApplicationApproved,
    ApplicationApprovedMessageType,
    ApplicationDeclined,
    ApplicationMessage,
    ElderMismatchError,
    InitiationRequest,
    NoChiefSetError,
    QuestMessage,
    QuestMessageType,
    TribeApplication,
    WrongPhaseError,
} from '../apply-tribe'
import { Application, ApplicationPhase } from '../entities/application'
import { Coordinates } from '../entities/location'
import { Member } from '../entities/member'
import { Message } from '../entities/message'
import { IQuest, QuestStatus, QuestType } from '../entities/quest'
import { Tribe } from '../entities/tribe'
import { User } from '../entities/user'
import { assign, createContext } from './test-context'

describe('Initiation quests:', () => {
    describe('Chief initiation', () => {
        it('transfers application to "chiefInitiation" phase', async () => {
            const world = await setUp()
            await world.tribeApplication.startInitiation(
                world.defaultInitiationRequest
            )
            const app = await world.applicationStore.getById(
                world.defaultInitiationRequest.applicationId
            )
            expect(app?.phase).toEqual(ApplicationPhase.chiefInitiation)
        })
        it('FAILs to start initiation NOT in "initial" phase', async () => {
            await failOnWrongPhase(
                ApplicationPhase.initial,
                'startInitiation',
                'chief'
            )
        })
        it('FAILs to start initiation without elder', async () => {
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
                    ...world.defaultInitiationRequest,
                    applicationId: badApp.id,
                })
            ).toBeRejectedWithError(NoChiefSetError)
        })
        it('FAILs to initiate with improper elder', async () => {
            const world = await setUp()
            await expectAsync(
                world.tribeApplication.startInitiation({
                    ...world.defaultInitiationRequest,
                    memberId: 'imporoper-elder-id',
                })
            ).toBeRejectedWithError(ElderMismatchError)
        })
        it('notifies a member on initiaition quest', async () => {
            const world = await setUp()
            const onQuest = world.spyOnMessage<QuestMessage>(QuestMessageType)
            await world.tribeApplication.startInitiation(
                world.defaultInitiationRequest
            )
            expect(onQuest).toHaveBeenCalledWith(
                jasmine.objectContaining<QuestMessage>({
                    type: QuestMessageType,
                    payload: jasmine.objectContaining<QuestMessage['payload']>({
                        targetMemberId: world.application.memberId,
                        questId: jasmine.any(String),
                        questType: QuestType.initiation,
                        time: world.defaultInitiationRequest.time,
                        place: world.defaultInitiationRequest.place,
                    }),
                })
            )
        })
        it('fires an initiation quest', async () => {
            const world = await setUp()
            await world.tribeApplication.startInitiation(
                world.defaultInitiationRequest
            )

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
                            date: world.defaultInitiationRequest.time,
                            place: world.defaultInitiationRequest.place,
                            memberIds: jasmine.arrayContaining([
                                world.chief.id,
                                world.application.memberId,
                            ]),
                        })
                    )
                }
            )
        })
    })

    describe('Chief approval', () => {
        it('FAILs if NOT in "chiefInitiation" phase', async () => {
            await failOnWrongPhase(
                ApplicationPhase.chiefInitiation,
                'approveByChief',
                'chief'
            )
        })
        it('FAILs to approve by wrong chief', async () => {
            const world = await setUp()
            await world.applicationStore.save(
                assign(world.application, {
                    phase: ApplicationPhase.chiefInitiation,
                })
            )
            await expectAsync(
                world.tribeApplication.approveByChief({
                    applicationId: world.application.id,
                    memberId: 'wrong-member-id',
                })
            ).toBeRejectedWithError(ElderMismatchError)
        })
        it('transfers approved application to shaman', async () => {
            const world = await setUp()
            await world.tribeApplication.startInitiation(
                world.defaultInitiationRequest
            )
            await world.tribeApplication.approveByChief({
                applicationId: world.application.id,
                memberId: world.chief.id,
            })
            const app = await world.applicationStore.getById(
                world.defaultInitiationRequest.applicationId
            )
            expect(app?.phase).toEqual(ApplicationPhase.awaitingShaman)
            expect(app?.shamanId).toEqual(world.shaman.id)
        })
        it('notifies shaman about application', async () => {
            const world = await setUp()
            await world.tribeApplication.startInitiation(
                world.defaultInitiationRequest
            )
            const onApprove = world.spyOnMessage<ApplicationMessage>(
                'application-message'
            )
            await world.tribeApplication.approveByChief({
                applicationId: world.application.id,
                memberId: world.chief.id,
            })

            expect(onApprove).toHaveBeenCalledWith(
                jasmine.objectContaining<ApplicationMessage>({
                    type: 'application-message',
                    payload: {
                        coverLetter: world.application.coverLetter,
                        elderId: world.shaman.id,
                        applicationId: world.application.id,
                        userName: world.user.name,
                    },
                })
            )
        })
        it('approves the memeber, if tribe has no shaman', async () => {
            const world = await setUp()
            await world.tribeStore.save(assign(world.tribe, { shamanId: null }))
            await world.tribeApplication.startInitiation(
                world.defaultInitiationRequest
            )
            await world.tribeApplication.approveByChief({
                applicationId: world.application.id,
                memberId: world.chief.id,
            })
            const app = await world.applicationStore.getById(
                world.defaultInitiationRequest.applicationId
            )
            const member = await world.memberStore.getById(world.newMember.id)
            expect(app?.phase).toEqual(ApplicationPhase.finished)
            expect(app?.status).toEqual('approved')
            expect(member?.isCandidate)
                .withContext('member.isCandidate')
                .toEqual(false)
        })
        it('notifies member on (express) approval', async () => {
            const world = await setUp()
            await world.tribeStore.save(assign(world.tribe, { shamanId: null }))
            const onApprove = world.spyOnMessage<ApplicationApproved>(
                ApplicationApprovedMessageType
            )
            await world.tribeApplication.startInitiation(
                world.defaultInitiationRequest
            )
            await world.tribeApplication.approveByChief({
                applicationId: world.application.id,
                memberId: world.chief.id,
            })
            expect(onApprove).toHaveBeenCalledWith(
                jasmine.objectContaining<ApplicationApproved>({
                    type: ApplicationApprovedMessageType,
                    payload: {
                        targetMemberId: world.newMember.id,
                    },
                })
            )
        })
    })

    describe('Shaman initiation', () => {
        it('FAILs if NOT in "awaitingShaman" phase', async () => {
            await failOnWrongPhase(
                ApplicationPhase.awaitingShaman,
                'startShamanInitiation',
                'chief'
            )
        })
        it('FAILs to initiate with improper elder', async () => {
            const world = await setUp()
            await world.tribeApplication.startInitiation(
                world.defaultInitiationRequest
            )
            await world.tribeApplication.approveByChief(
                world.defaultInitiationRequest
            )
            await expectAsync(
                world.tribeApplication.startShamanInitiation({
                    ...world.defaultInitiationRequest,
                    memberId: 'imporoper-elder-id',
                })
            ).toBeRejectedWithError(ElderMismatchError)
        })
        it('transfers application to "shamanInitiation" phase', async () => {
            const world = await setUp()
            await world.tribeApplication.startInitiation(
                world.defaultInitiationRequest
            )
            await world.tribeApplication.approveByChief(
                world.defaultInitiationRequest
            )
            await world.tribeApplication.startShamanInitiation({
                ...world.defaultInitiationRequest,
                memberId: world.shaman.id,
            })
            const app = await world.applicationStore.getById(
                world.defaultInitiationRequest.applicationId
            )
            expect(app?.phase).toEqual(ApplicationPhase.shamanInitiation)
        })
        it('fires an initiation quest', async () => {
            const world = await setUp()
            const onQuest = world.spyOnMessage<QuestMessage>(QuestMessageType)
            await world.tribeApplication.startInitiation(
                world.defaultInitiationRequest
            )
            await world.tribeApplication.approveByChief(
                world.defaultInitiationRequest
            )
            // get rid of notififcation fired by startInitiation
            onQuest.calls.reset()
            await world.tribeApplication.startShamanInitiation({
                ...world.defaultInitiationRequest,
                memberId: world.shaman.id,
            })

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
                            date: world.defaultInitiationRequest.time,
                            place: world.defaultInitiationRequest.place,
                            memberIds: jasmine.arrayContaining([
                                world.shaman.id,
                                world.application.memberId,
                            ]),
                        })
                    )
                }
            )
        })
        it('notifies a member on initiaition quest', async () => {
            const world = await setUp()
            const onQuest = world.spyOnMessage<QuestMessage>(QuestMessageType)
            await world.tribeApplication.startInitiation(
                world.defaultInitiationRequest
            )
            await world.tribeApplication.approveByChief(
                world.defaultInitiationRequest
            )
            // get rid of notififcation fired by startInitiation
            onQuest.calls.reset()
            await world.tribeApplication.startShamanInitiation({
                ...world.defaultInitiationRequest,
                memberId: world.shaman.id,
            })
            expect(onQuest).toHaveBeenCalledWith(
                jasmine.objectContaining<QuestMessage>({
                    type: QuestMessageType,
                    payload: jasmine.objectContaining<QuestMessage['payload']>({
                        targetMemberId: world.application.memberId,
                        questId: jasmine.any(String),
                        questType: QuestType.initiation,
                        time: world.defaultInitiationRequest.time,
                        place: world.defaultInitiationRequest.place,
                    }),
                })
            )
        })
    })

    describe('Shaman approval', () => {
        it('FAILs if NOT in "shamanInitiation" phase', async () => {
            await failOnWrongPhase(
                ApplicationPhase.shamanInitiation,
                'approveByShaman',
                'chief'
            )
        })

        it('FAILs to approve by wrong shaman', async () => {
            const world = await setUp()

            await world.tribeApplication.startInitiation(
                world.defaultInitiationRequest
            )
            await world.tribeApplication.approveByChief(
                world.defaultInitiationRequest
            )
            await world.tribeApplication.startShamanInitiation({
                ...world.defaultInitiationRequest,
                memberId: world.shaman.id,
            })
            await expectAsync(
                world.tribeApplication.approveByShaman({
                    applicationId: world.application.id,
                    memberId: 'wrong-member-id',
                })
            ).toBeRejectedWithError(ElderMismatchError)
        })
        it('makes a full-fledged member after two approvals', async () => {
            const world = await setUp()

            await world.tribeApplication.startInitiation(
                world.defaultInitiationRequest
            )
            await world.tribeApplication.approveByChief(
                world.defaultInitiationRequest
            )
            await world.tribeApplication.startShamanInitiation({
                ...world.defaultInitiationRequest,
                memberId: world.shaman.id,
            })
            await world.tribeApplication.approveByShaman({
                applicationId: world.application.id,
                memberId: world.shaman.id,
            })
            const app = await world.applicationStore.getById(
                world.defaultInitiationRequest.applicationId
            )
            const member = await world.memberStore.getById(world.newMember.id)
            expect(app?.phase).toEqual(ApplicationPhase.finished)
            expect(app?.status).toEqual('approved')
            expect(member?.isCandidate)
                .withContext('member.isCandidate')
                .toEqual(false)
        })
        it('notifies a member on their approval', async () => {
            const world = await setUp()
            const onApprove = world.spyOnMessage<ApplicationApproved>(
                'application-approved'
            )

            await world.tribeApplication.startInitiation(
                world.defaultInitiationRequest
            )
            await world.tribeApplication.approveByChief(
                world.defaultInitiationRequest
            )
            await world.tribeApplication.startShamanInitiation({
                ...world.defaultInitiationRequest,
                memberId: world.shaman.id,
            })
            // get rid of notififcation fired by startInitiation
            onApprove.calls.reset()
            await world.tribeApplication.approveByShaman({
                applicationId: world.application.id,
                memberId: world.shaman.id,
            })
            expect(onApprove).toHaveBeenCalledWith(
                jasmine.objectContaining<ApplicationApproved>({
                    type: ApplicationApprovedMessageType,
                    payload: {
                        targetMemberId: world.newMember.id,
                    },
                })
            )
        })
    })

    describe('Decline', () => {
        it('FAILs to decilne by shaman if NOT in "shamanInitiation" phase', async () => {
            await failOnWrongPhase(
                ApplicationPhase.shamanInitiation,
                'decline',
                'shaman'
            )
        })
        it('FAILs to decilne by chief if NOT in "chiefzInitiation" phase', async () => {
            await failOnWrongPhase(
                ApplicationPhase.chiefInitiation,
                'decline',
                'chief'
            )
        })
        it('FAILs to decline by wrong elder (chief)', async () => {
            const world = await setUp()

            await world.tribeApplication.startInitiation(
                world.defaultInitiationRequest
            )
            await expectAsync(
                world.tribeApplication.decline({
                    applicationId: world.application.id,
                    memberId: 'wrong-member-id',
                })
            ).toBeRejectedWithError(ElderMismatchError)
        })
        it('FAILs to decline by wrong elder (shaman)', async () => {
            const world = await setUp()

            await world.tribeApplication.startInitiation(
                world.defaultInitiationRequest
            )
            await world.tribeApplication.approveByChief(
                world.defaultInitiationRequest
            )
            await world.tribeApplication.startShamanInitiation({
                ...world.defaultInitiationRequest,
                memberId: world.shaman.id,
            })
            await expectAsync(
                world.tribeApplication.decline({
                    applicationId: world.application.id,
                    memberId: 'wrong-member-id',
                })
            ).toBeRejectedWithError(ElderMismatchError)
        })
        it('finalizes declined application', async () => {
            const world = await setUp()
            await world.tribeApplication.startInitiation(
                world.defaultInitiationRequest
            )
            await world.tribeApplication.decline(world.defaultInitiationRequest)
            const app = await world.applicationStore.getById(
                world.defaultInitiationRequest.applicationId
            )
            const member = await world.memberStore.getById(world.newMember.id)
            expect(app?.phase).toEqual(ApplicationPhase.finished)
            expect(app?.status).toEqual('decilned')
            expect(member?.isCandidate)
                .withContext('member.isCandidate')
                .toEqual(true)
        })
        it('notifies non-member on application decline', async () => {
            const world = await setUp()
            const onApprove = world.spyOnMessage<ApplicationDeclined>(
                'application-declined'
            )

            await world.tribeApplication.startInitiation(
                world.defaultInitiationRequest
            )
            // get rid of notififcation fired by startInitiation
            onApprove.calls.reset()
            await world.tribeApplication.decline(world.defaultInitiationRequest)
            expect(onApprove).toHaveBeenCalledWith(
                jasmine.objectContaining<ApplicationDeclined>({
                    type: 'application-declined',
                    payload: {
                        targetMemberId: world.newMember.id,
                    },
                })
            )
        })
    })
})

async function setUp() {
    const context = createContext()
    const tribe = await context.stores.tribeStore.save(
        new Tribe({
            name: 'Foo Tribe',
        })
    )
    const user = await context.stores.userStore.save(
        new User({ coordinates: {} as Coordinates, name: 'foo-user' })
    )
    const [
        newMember,
        chief,
        shaman,
    ] = await context.stores.memberStore.saveBulk([
        new Member({
            tribeId: tribe.id,
            userId: user.id,
        }),
        new Member({
            tribeId: tribe.id,
            userId: 'chief-user',
            isCandidate: false,
        }),
        new Member({
            tribeId: tribe.id,
            userId: 'shaman-user',
            isCandidate: false,
        }),
    ])
    await context.stores.tribeStore.save(
        assign(tribe, { chiefId: chief.id, shamanId: shaman.id })
    )
    const application = await context.stores.applicationStore.save(
        new Application({
            coverLetter: 'I want to FOO!',
            memberId: newMember.id,
            tribeId: tribe.id,
            chiefId: chief.id,
        })
    )
    const defaultInitiationRequest: InitiationRequest = {
        applicationId: application.id,
        memberId: chief.id,
        place: 'The Foo Bar',
        time: 1_700_100_500_000,
    }

    const tribeApplication = new TribeApplication(context)
    return {
        tribe,
        newMember,
        user,
        chief,
        shaman,
        defaultInitiationRequest,
        application,
        tribeApplication,
        ...context.async,
        ...context.stores,
        spyOnMessage<T extends Message>(messageType: T['type']) {
            const spy = jasmine.createSpy(`on${messageType}`)
            context.async.notififcationBus.subscribe(messageType, spy)
            return spy
        },
    }
}

async function failOnWrongPhase(
    correctPhase: ApplicationPhase | ApplicationPhase[],
    metod:
        | 'startInitiation'
        | 'approveByChief'
        | 'approveByShaman'
        | 'startShamanInitiation'
        | 'decline',
    role: 'chief' | 'shaman'
) {
    await Promise.all(
        Object.values(ApplicationPhase).map(async (phase) => {
            if (phase === correctPhase) {
                return Promise.resolve()
            }
            const world = await setUp()
            await world.applicationStore.save(
                assign(world.application, { phase, shamanId: world.shaman.id })
            )
            await expectAsync(
                world.tribeApplication[metod]({
                    ...world.defaultInitiationRequest,
                    memberId: world[role].id,
                })
            )
                .withContext(phase)
                .toBeRejectedWithError(WrongPhaseError)
        })
    )
}
