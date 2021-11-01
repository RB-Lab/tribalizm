import { ApplicationMessage } from '../use-cases/apply-tribe'
import {
    Application,
    ApplicationPhase,
} from '../use-cases/entities/application'
import { IQuest, QuestStatus, QuestType } from '../use-cases/entities/quest'
import {
    ApplicationApproved,
    ApplicationDeclined,
    ElderMismatchError,
    Initiation,
    InitiationRequest,
    NoChiefSetError,
    WrongPhaseError,
} from '../use-cases/initiation'
import { QuestMessage } from '../use-cases/utils/quest-message'
import { createContext, makeMessageSpy } from './test-context'

describe('Initiation quests:', () => {
    describe('Chief initiation', () => {
        it('transfers application to "chiefInitiation" phase', async () => {
            const world = await setUp()
            await world.initiation.startInitiation(world.initReq)
            const app = await world.applicationStore.getById(
                world.initReq.applicationId
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
                world.initiation.startInitiation({
                    ...world.initReq,
                    applicationId: badApp.id,
                })
            ).toBeRejectedWithError(NoChiefSetError)
        })
        it('FAILs to initiate with improper elder', async () => {
            const world = await setUp()
            await expectAsync(
                world.initiation.startInitiation({
                    ...world.initReq,
                    elderUserId: world.users[world.users.length - 2].id,
                })
            ).toBeRejectedWithError(ElderMismatchError)
        })
        it('notifies a member on initiaition quest', async () => {
            const world = await setUp()
            const onQuest =
                world.spyOnMessage<QuestMessage>('new-quest-message')
            await world.initiation.startInitiation(world.initReq)
            expect(onQuest).toHaveBeenCalledWith(
                jasmine.objectContaining<QuestMessage>({
                    type: 'new-quest-message',
                    payload: jasmine.objectContaining<QuestMessage['payload']>({
                        targetMemberId: world.application.memberId,
                        questId: jasmine.any(String),
                        type: QuestType.initiation,
                        time: world.initReq.time,
                        place: world.initReq.place,
                    }),
                })
            )
        })
        it('fires an initiation quest', async () => {
            const world = await setUp()

            world.notififcationBus.subscribe<QuestMessage>(
                'new-quest-message',
                async (message) => {
                    const quest = await world.questStore.getById(
                        message.payload.questId
                    )
                    expect(quest).toEqual(
                        jasmine.objectContaining<IQuest>({
                            type: QuestType.initiation,
                            status: QuestStatus.proposed,
                            time: world.initReq.time,
                            place: world.initReq.place,
                            memberIds: jasmine.arrayContaining([
                                world.chief.id,
                                world.application.memberId,
                            ]),
                        })
                    )
                }
            )
            await world.initiation.startInitiation(world.initReq)
        })
        it('marks chief as "accepted"', async () => {
            const world = await setUp()
            await world.initiation.startInitiation(world.initReq)
            const quest = await world.questStore._last()
            expect(quest!.acceptedIds).toEqual([world.chief.id])
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
            await world.applicationStore.save({
                ...world.application,
                phase: ApplicationPhase.chiefInitiation,
            })
            await expectAsync(
                world.initiation.approveByChief({
                    applicationId: world.application.id,
                    elderUserId: world.users[world.users.length - 2].id,
                })
            ).toBeRejectedWithError(ElderMismatchError)
        })
        it('transfers approved application to shaman', async () => {
            const world = await toChiefAproval()
            await world.initiation.approveByChief({
                applicationId: world.application.id,
                elderUserId: world.chiefUser.id,
            })
            const app = await world.applicationStore.getById(
                world.initReq.applicationId
            )
            expect(app?.phase).toEqual(ApplicationPhase.awaitingShaman)
            expect(app?.shamanId).toEqual(world.shaman.id)
        })
        it('notifies shaman about application', async () => {
            const world = await toChiefAproval()
            const onApprove = world.spyOnMessage<ApplicationMessage>(
                'application-message'
            )

            await world.initiation.approveByChief({
                applicationId: world.application.id,
                elderUserId: world.chiefUser.id,
            })

            expect(onApprove).toHaveBeenCalledWith(
                jasmine.objectContaining<ApplicationMessage>({
                    type: 'application-message',
                    payload: {
                        elderUserId: world.shaman.userId,
                        tribeName: world.tribe.name,
                        coverLetter: world.application.coverLetter,
                        applicationId: world.application.id,
                        userName: world.user.name,
                    },
                })
            )
        })
        it('approves the memeber, if tribe has no shaman', async () => {
            const world = await toChiefAproval()
            await world.tribeStore.save({ ...world.tribe, shamanId: null })
            await world.initiation.approveByChief({
                applicationId: world.application.id,
                elderUserId: world.chiefUser.id,
            })
            const app = await world.applicationStore.getById(
                world.initReq.applicationId
            )
            const member = await world.memberStore.getById(world.newMember.id)
            expect(app?.phase).toEqual(ApplicationPhase.finished)
            expect(app?.status).toEqual('approved')
            expect(member?.isCandidate)
                .withContext('member.isCandidate')
                .toEqual(false)
        })
        it('approves member if the chief is also a shaman', async () => {
            const world = await toChiefAproval()
            await world.tribeStore.save({
                ...world.tribe,
                shamanId: world.tribe.chiefId,
            })
            await world.initiation.approveByChief({
                applicationId: world.application.id,
                elderUserId: world.chiefUser.id,
            })
            const app = await world.applicationStore.getById(
                world.initReq.applicationId
            )
            const member = await world.memberStore.getById(world.newMember.id)
            expect(app?.phase).toEqual(ApplicationPhase.finished)
            expect(app?.status).toEqual('approved')
            expect(member?.isCandidate)
                .withContext('member.isCandidate')
                .toEqual(false)
        })
        it('notifies member on (express) approval', async () => {
            const world = await toChiefAproval()
            await world.tribeStore.save({ ...world.tribe, shamanId: null })
            const onApprove = world.spyOnMessage<ApplicationApproved>(
                'application-approved'
            )
            await world.initiation.approveByChief({
                applicationId: world.application.id,
                elderUserId: world.chiefUser.id,
            })
            expect(onApprove).toHaveBeenCalledWith(
                jasmine.objectContaining<ApplicationApproved>({
                    type: 'application-approved',
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
            const world = await toShamanInitiation()
            await expectAsync(
                world.initiation.startShamanInitiation({
                    ...world.initReq,
                    elderUserId: world.users[world.users.length - 2].id,
                })
            ).toBeRejectedWithError(ElderMismatchError)
        })
        it('transfers application to "shamanInitiation" phase', async () => {
            const world = await toShamanInitiation()
            await world.initiation.startShamanInitiation({
                ...world.initReq,
                elderUserId: world.shamanUser.id,
            })
            const app = await world.applicationStore.getById(
                world.initReq.applicationId
            )
            expect(app?.phase).toEqual(ApplicationPhase.shamanInitiation)
        })
        it('fires an initiation quest', async () => {
            const world = await toShamanInitiation()

            world.notififcationBus.subscribe<QuestMessage>(
                'new-quest-message',
                async (message) => {
                    const quest = await world.questStore.getById(
                        message.payload.questId
                    )
                    expect(quest).toEqual(
                        jasmine.objectContaining<IQuest>({
                            type: QuestType.initiation,
                            status: QuestStatus.proposed,
                            time: world.initReq.time,
                            place: world.initReq.place,
                            memberIds: jasmine.arrayContaining([
                                world.shaman.id,
                                world.application.memberId,
                            ]),
                        })
                    )
                }
            )
            await world.initiation.startShamanInitiation({
                ...world.initReq,
                elderUserId: world.shamanUser.id,
            })
        })
        it('notifies a member on initiaition quest', async () => {
            const world = await toShamanInitiation()
            const onQuest =
                world.spyOnMessage<QuestMessage>('new-quest-message')
            await world.initiation.startShamanInitiation({
                ...world.initReq,
                elderUserId: world.shamanUser.id,
            })
            expect(onQuest).toHaveBeenCalledWith(
                jasmine.objectContaining<QuestMessage>({
                    type: 'new-quest-message',
                    payload: jasmine.objectContaining<QuestMessage['payload']>({
                        targetMemberId: world.application.memberId,
                        questId: jasmine.any(String),
                        type: QuestType.initiation,
                        time: world.initReq.time,
                        place: world.initReq.place,
                    }),
                })
            )
        })
        it('marks chief as "accepted"', async () => {
            const world = await toShamanInitiation()
            await world.initiation.startShamanInitiation({
                ...world.initReq,
                elderUserId: world.shamanUser.id,
            })
            const quest = await world.questStore._last()
            expect(quest!.acceptedIds).toEqual([world.shaman.id])
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
            const world = await toShamanApproval()
            await expectAsync(
                world.initiation.approveByShaman({
                    applicationId: world.application.id,
                    elderUserId: world.users[world.users.length - 2].id,
                })
            ).toBeRejectedWithError(ElderMismatchError)
        })
        it('makes a full-fledged member after two approvals', async () => {
            const world = await toShamanApproval()
            await world.initiation.approveByShaman({
                applicationId: world.application.id,
                elderUserId: world.shamanUser.id,
            })
            const app = await world.applicationStore.getById(
                world.initReq.applicationId
            )
            const member = await world.memberStore.getById(world.newMember.id)
            expect(app?.phase).toEqual(ApplicationPhase.finished)
            expect(app?.status).toEqual('approved')
            expect(member?.isCandidate)
                .withContext('member.isCandidate')
                .toEqual(false)
        })
        it('notifies a member on their approval', async () => {
            const world = await toShamanApproval()
            const onApprove = world.spyOnMessage<ApplicationApproved>(
                'application-approved'
            )

            await world.initiation.approveByShaman({
                applicationId: world.application.id,
                elderUserId: world.shamanUser.id,
            })
            expect(onApprove).toHaveBeenCalledWith(
                jasmine.objectContaining<ApplicationApproved>({
                    type: 'application-approved',
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
            const world = await toChiefAproval()
            await expectAsync(
                world.initiation.decline({
                    applicationId: world.application.id,
                    elderUserId: world.users[world.users.length - 2].id,
                })
            ).toBeRejectedWithError(ElderMismatchError)
        })
        it('FAILs to decline by wrong elder (shaman)', async () => {
            const world = await toShamanApproval()
            await expectAsync(
                world.initiation.decline({
                    applicationId: world.application.id,
                    elderUserId: world.users[world.users.length - 2].id,
                })
            ).toBeRejectedWithError(ElderMismatchError)
        })
        it('finalizes declined application', async () => {
            const world = await toChiefAproval()
            await world.initiation.decline(world.initReq)
            const app = await world.applicationStore.getById(
                world.initReq.applicationId
            )

            const member = await world.memberStore.getById(world.newMember.id)
            expect(app!.phase).toEqual(ApplicationPhase.finished)
            expect(app!.status).toEqual('decilned')
            expect(member!.isCandidate)
                .withContext('member.isCandidate')
                .toEqual(true)
        })
        it('notifies non-member on application decline', async () => {
            const world = await toShamanApproval()
            const onDecline = world.spyOnMessage<ApplicationDeclined>(
                'application-declined'
            )

            await world.initiation.decline({
                ...world.initReq,
                elderUserId: world.shamanUser.id,
            })
            expect(onDecline).toHaveBeenCalledWith(
                jasmine.objectContaining<ApplicationDeclined>({
                    type: 'application-declined',
                    payload: {
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
    const [chief, shaman, newMember] = members
    const [chiefUser, shamanUser, newMemberUser] = users
    await context.stores.tribeStore.save({
        ...tribe,
        chiefId: chief.id,
        shamanId: shaman.id,
    })
    await context.stores.memberStore.save({ ...newMember, isCandidate: true })
    const user = await context.stores.userStore.getById(newMember.userId)
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
        elderUserId: chiefUser.id,
        place: 'The Foo Bar',
        time: 1_700_100_500_000,
    }

    const initiation = new Initiation(context)
    return {
        tribe,
        newMember,
        users,
        user: user!,
        chief,
        shaman,
        chiefUser,
        shamanUser,
        initReq: defaultInitiationRequest,
        application,
        initiation,
        ...context.async,
        ...context.stores,
        spyOnMessage: makeMessageSpy(context.async.notififcationBus),
    }
}

async function toChiefAproval() {
    const world = await setUp()
    await world.initiation.startInitiation(world.initReq)
    return world
}

async function toShamanInitiation() {
    const world = await toChiefAproval()

    await world.initiation.approveByChief(world.initReq)
    return world
}

async function toShamanApproval() {
    const world = await toShamanInitiation()

    await world.initiation.startShamanInitiation({
        ...world.initReq,
        elderUserId: world.shamanUser.id,
    })
    return world
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
            await world.applicationStore.save({
                ...world.application,
                phase,
                shamanId: world.shaman.id,
            })
            const user = role === 'chief' ? 'chiefUser' : 'shamanUser'
            await expectAsync(
                world.initiation[metod]({
                    ...world.initReq,
                    elderUserId: world[user].id,
                })
            )
                .withContext(phase)
                .toBeRejectedWithError(WrongPhaseError)
        })
    )
}
