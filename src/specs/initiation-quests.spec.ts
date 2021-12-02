import { ApplicationMessage, TribeApplication } from '../use-cases/apply-tribe'
import {
    Application,
    ApplicationPhase,
} from '../use-cases/entities/application'
import {
    InitiationQuest,
    IQuest,
    Quest,
    QuestStatus,
    QuestType,
} from '../use-cases/entities/quest'
import { User } from '../use-cases/entities/user'
import {
    ApplicationApprovedMessage,
    ApplicationDeclinedMessage,
    ElderMismatchError,
    Initiation,
    InitiationRequest,
    NoChiefSetError,
    WrongPhaseError,
} from '../use-cases/initiation'
import { createContext, makeMessageSpy } from './test-context'

describe('Initiation quests:', () => {
    describe('Chief initiation', () => {
        it('transfers application to "chiefInitiation" phase', async () => {
            const world = await setUp()
            await world.initiation.startInitiation(world.initReq)
            const app = await world.applicationStore.getById(
                world.application.id
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
            const quest = await world.questStore.save(
                new InitiationQuest({
                    applicationId: badApp.id,
                })
            )
            await expectAsync(
                world.initiation.startInitiation({
                    ...world.initReq,
                    questId: quest.id,
                })
            ).toBeRejectedWithError(NoChiefSetError)
        })
        it('FAILs to initiate with improper elder', async () => {
            const world = await setUp()
            await expectAsync(
                world.initiation.startInitiation({
                    ...world.initReq,
                    elderId: world.members[world.members.length - 2].id,
                })
            ).toBeRejectedWithError(ElderMismatchError)
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
                    questId: world.quest.id,
                    elderId: world.members[world.members.length - 2].id,
                })
            ).toBeRejectedWithError(ElderMismatchError)
        })
        it('transfers approved application to shaman', async () => {
            const world = await toChiefAproval()
            await world.initiation.approveByChief({
                questId: world.quest.id,
                elderId: world.chief.id,
            })
            const app = await world.applicationStore.getById(
                world.application.id
            )
            expect(app?.phase).toEqual(ApplicationPhase.awaitingShaman)
            expect(app?.shamanId).toEqual(world.shaman.id)
        })

        it('fires an initiation quest', async () => {
            const world = await toChiefAproval()

            await world.initiation.approveByChief({
                questId: world.quest.id,
                elderId: world.chief.id,
            })
            const quest = await world.questStore._last()
            expect(quest).toEqual(
                jasmine.objectContaining<IQuest>({
                    type: QuestType.initiation,
                    status: QuestStatus.proposed,
                    memberIds: jasmine.arrayContaining([
                        world.shaman.id,
                        world.application.memberId,
                    ]),
                })
            )
        })

        it('notifies shaman about application', async () => {
            const world = await toChiefAproval()
            const onApprove = world.spyOnMessage<ApplicationMessage>(
                'application-message'
            )

            await world.initiation.approveByChief({
                questId: world.quest.id,
                elderId: world.chief.id,
            })
            const newQuest = await world.questStore._last()

            expect(onApprove).toHaveBeenCalledWith(
                jasmine.objectContaining<ApplicationMessage>({
                    type: 'application-message',
                    payload: {
                        targetUserId: world.shaman.userId,
                        targetMemberId: world.shaman.id,
                        tribeName: world.tribe.name,
                        coverLetter: world.application.coverLetter,
                        userName: world.user.name,
                        questId: newQuest.id,
                        elder: 'shaman',
                    },
                })
            )
        })
        it('approves the memeber, if tribe has no shaman', async () => {
            const world = await toChiefAproval()
            await world.tribeStore.save({ ...world.tribe, shamanId: null })
            await world.initiation.approveByChief({
                questId: world.quest.id,
                elderId: world.chief.id,
            })
            const app = await world.applicationStore.getById(
                world.application.id
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
                questId: world.quest.id,
                elderId: world.chief.id,
            })
            const app = await world.applicationStore.getById(
                world.application.id
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
            const onApprove = world.spyOnMessage<ApplicationApprovedMessage>(
                'application-approved'
            )
            await world.initiation.approveByChief({
                questId: world.quest.id,
                elderId: world.chief.id,
            })
            expect(onApprove).toHaveBeenCalledWith(
                jasmine.objectContaining<ApplicationApprovedMessage>({
                    type: 'application-approved',
                    payload: {
                        tribe: world.tribe.name,
                        targetUserId: world.newMember.userId,
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
                    elderId: world.members[world.members.length - 2].id,
                })
            ).toBeRejectedWithError(ElderMismatchError)
        })
        it('transfers application to "shamanInitiation" phase', async () => {
            const world = await toShamanInitiation()
            await world.initiation.startShamanInitiation({
                ...world.initReq,
                elderId: world.shaman.id,
            })
            const app = await world.applicationStore.getById(
                world.application.id
            )
            expect(app?.phase).toEqual(ApplicationPhase.shamanInitiation)
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
                    questId: world.quest.id,
                    elderId: world.members[world.members.length - 2].id,
                })
            ).toBeRejectedWithError(ElderMismatchError)
        })
        it('makes a full-fledged member after two approvals', async () => {
            const world = await toShamanApproval()
            await world.initiation.approveByShaman({
                questId: world.quest.id,
                elderId: world.shaman.id,
            })
            const app = await world.applicationStore.getById(
                world.application.id
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
            const onApprove = world.spyOnMessage<ApplicationApprovedMessage>(
                'application-approved'
            )

            await world.initiation.approveByShaman({
                questId: world.quest.id,
                elderId: world.shaman.id,
            })
            expect(onApprove).toHaveBeenCalledWith(
                jasmine.objectContaining<ApplicationApprovedMessage>({
                    type: 'application-approved',
                    payload: {
                        tribe: world.tribe.name,
                        targetUserId: world.newMember.userId,
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
        it('FAILs to decilne by chief if NOT in "chiefzInitiation" or "initial" phase', async () => {
            await failOnWrongPhase(
                [ApplicationPhase.chiefInitiation, ApplicationPhase.initial],
                'decline',
                'chief'
            )
        })
        it('FAILs to decline by wrong elder (chief)', async () => {
            const world = await toChiefAproval()
            await expectAsync(
                world.initiation.decline({
                    questId: world.quest.id,
                    elderId: world.members[world.members.length - 2].id,
                })
            ).toBeRejectedWithError(ElderMismatchError)
        })
        it('FAILs to decline by wrong elder (shaman)', async () => {
            const world = await toShamanApproval()
            await expectAsync(
                world.initiation.decline({
                    questId: world.quest.id,
                    elderId: world.members[world.members.length - 2].id,
                })
            ).toBeRejectedWithError(ElderMismatchError)
        })
        it('finalizes declined application', async () => {
            const world = await toChiefAproval()
            await world.initiation.decline(world.initReq)
            const app = await world.applicationStore.getById(
                world.application.id
            )

            const member = await world.memberStore.getById(world.newMember.id)
            expect(app!.phase).toEqual(ApplicationPhase.finished)
            expect(app!.status).toEqual('declined')
            expect(member!.isCandidate)
                .withContext('member.isCandidate')
                .toEqual(true)
        })
        it('notifies non-member on application decline', async () => {
            const world = await toShamanApproval()
            const onDecline = world.spyOnMessage<ApplicationDeclinedMessage>(
                'application-declined'
            )

            await world.initiation.decline({
                ...world.initReq,
                elderId: world.shaman.id,
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
        elderId: chief.id,
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

async function toChiefAproval() {
    const world = await setUp()
    await world.initiation.startInitiation(world.initReq)
    return world
}

async function toShamanInitiation() {
    const world = await toChiefAproval()

    await world.initiation.approveByChief(world.initReq)
    const quest = await world.questStore._last()
    world.initReq.questId = quest.id
    return { ...world, quest }
}

async function toShamanApproval() {
    const world = await toShamanInitiation()

    await world.initiation.startShamanInitiation({
        ...world.initReq,
        elderId: world.shaman.id,
    })
    return world
}

async function failOnWrongPhase(
    correctPhase: ApplicationPhase | ApplicationPhase[],
    method:
        | 'startInitiation'
        | 'approveByChief'
        | 'approveByShaman'
        | 'startShamanInitiation'
        | 'decline',
    role: 'chief' | 'shaman'
) {
    await Promise.all(
        Object.values(ApplicationPhase).map(async (phase) => {
            if (Array.isArray(correctPhase) && correctPhase.includes(phase)) {
                return Promise.resolve()
            }
            if (phase === correctPhase) {
                return Promise.resolve()
            }
            const world = await setUp()
            await world.applicationStore.save({
                ...world.application,
                phase,
                shamanId: world.shaman.id,
            })
            const user = role === 'chief' ? 'chief' : 'shaman'
            await expectAsync(
                world.initiation[method]({
                    ...world.initReq,
                    elderId: world[user].id,
                })
            )
                .withContext(phase)
                .toBeRejectedWithError(WrongPhaseError)
        })
    )
}
