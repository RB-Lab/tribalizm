import { Member } from '../use-cases/entities/member'
import {
    IndeclinableError,
    InvalidAcceptanceTime,
    InvalidTimeProposal,
    NotYourQuest,
    Quest,
    QuestStatus,
    QuestType,
} from '../use-cases/entities/quest'
import {
    QuestAcceptedMessage,
    QuestChangeMessage,
    QuestNegotiation,
} from '../use-cases/negotiate-quest'
import { QuestMessage } from '../use-cases/utils/quest-message'
import { HowWasQuestTask } from '../use-cases/utils/scheduler'
import { createContext } from './test-context'

describe('Quest negotiation', () => {
    it('updates quest details on change proposal', async () => {
        const world = await setUp()
        await world.questNegotiation.proposeChange(world.defaultProposal)
        const quest = await world.questStore.getById(
            world.defaultProposal.questId
        )
        expect(quest?.place).toEqual(world.defaultProposal.place)
        expect(quest?.time).toEqual(world.defaultProposal.time)
    })
    it('notifies other party on proposed changes', async () => {
        const world = await setUp()
        const onQuestChanges = world.spyOnMessage<QuestChangeMessage>(
            'quest-change-proposed'
        )
        await world.questNegotiation.proposeChange(world.defaultProposal)
        expect(onQuestChanges).toHaveBeenCalledWith(
            jasmine.objectContaining<QuestChangeMessage>({
                type: 'quest-change-proposed',
                payload: jasmine.objectContaining<
                    QuestChangeMessage['payload']
                >({
                    description: world.quest.description,
                    place: world.defaultProposal.place,
                    proposingMemberId: world.defaultProposal.memberId,
                    questId: world.quest.id,
                    time: world.defaultProposal.time,
                    targetMemberId: world.member2.id,
                }),
            })
        )
    })
    it('resets accepted quest to proposed on new proposal', async () => {
        const world = await setUp()
        await world.questNegotiation.proposeChange(world.defaultProposal)
        await world.questNegotiation.acceptQuest({
            questId: world.quest.id,
            memberId: world.member2.id,
        })
        await world.questNegotiation.proposeChange(world.defaultProposal)
        const quest = await world.questStore.getById(world.quest.id)
        expect(quest?.status).toEqual(QuestStatus.proposed)
    })
    it('FAILs to propose back in time', async () => {
        const world = await setUp()
        await expectAsync(
            world.questNegotiation.proposeChange({
                ...world.defaultProposal,
                time: Date.now() - 100_500_000,
            })
        ).toBeRejectedWithError(InvalidTimeProposal)
    })
    it('needs only other party to accept proposal', async () => {
        const world = await setUp()
        // changes proposed by member1, so they accepted them
        await world.questNegotiation.proposeChange(world.defaultProposal)
        // the only other party in quest is memeber2
        await world.questNegotiation.acceptQuest({
            questId: world.quest.id,
            memberId: world.member2.id,
        })
        // so, when they agree quest must be accepted
        const quest = await world.questStore.getById(world.quest.id)
        expect(quest!.status).toEqual(QuestStatus.accepted)
    })
    it('notifes other party on acceptance', async () => {
        const world = await setUp()
        const onQuestAccepted =
            world.spyOnMessage<QuestAcceptedMessage>('quest-accepted')
        await world.questNegotiation.proposeChange(world.defaultProposal)
        await world.questNegotiation.acceptQuest({
            questId: world.quest.id,
            memberId: world.member2.id,
        })
        const quest = await world.questStore.getById(world.quest.id)
        expect(onQuestAccepted).toHaveBeenCalledWith(
            jasmine.objectContaining<QuestAcceptedMessage>({
                type: 'quest-accepted',
                payload: jasmine.objectContaining<
                    QuestAcceptedMessage['payload']
                >({
                    description: quest!.description,
                    place: quest!.place,
                    questId: quest!.id,
                    time: quest!.time,
                    targetMemberId: world.member1.id,
                }),
            })
        )
    })
    describe('allocates "how was it" task ', () => {
        it('five hours after accepted quest time for coordination quests', async () => {
            const world = await setUp()
            await world.questNegotiation.proposeChange(world.defaultProposal)
            await world.questNegotiation.acceptQuest({
                questId: world.quest.id,
                memberId: world.member2.id,
            })
            const tasks = (await world.taskStore.find({
                type: 'how-was-quest',
            })) as HowWasQuestTask[]
            expect(tasks.length).toBe(1)
            expect(tasks[0].done).toBe(false)
            expect(tasks[0].time).toBe(
                world.defaultProposal.time + 5 * 3_600_000
            )
            expect(tasks[0].payload.questId).toEqual(world.quest!.id)
        })
        it('two hours after accepted quest time for init/intro', async () => {
            const world = await setUp()
            await world.questStore.save({
                ...world.quest,
                type: QuestType.introduction,
            })
            await world.questNegotiation.proposeChange(world.defaultProposal)
            await world.questNegotiation.acceptQuest({
                questId: world.quest.id,
                memberId: world.member2.id,
            })
            const tasks = (await world.taskStore.find({
                type: 'how-was-quest',
            })) as HowWasQuestTask[]
            expect(tasks.length).toBe(1)
            expect(tasks[0].done).toBe(false)
            expect(tasks[0].time).toBe(
                world.defaultProposal.time + 2 * 3_600_000
            )
            expect(tasks[0].payload.questId).toEqual(world.quest!.id)
        })
    })
    it('needs all parties to accept proposal', async () => {
        const world = await setUp()
        const onQuestAccepted =
            world.spyOnMessage<QuestAcceptedMessage>('quest-accepted')
        const member3 = await world.memberStore.save(
            new Member({
                tribeId: 'tribe.id',
                userId: 'user-3',
            })
        )
        world.quest.memberIds = [...world.quest.memberIds, member3.id]
        await world.questStore.save(world.quest)
        await world.questNegotiation.proposeChange(world.defaultProposal)
        await world.questNegotiation.acceptQuest({
            memberId: member3.id,
            questId: world.quest.id,
        })
        const quest = await world.questStore.getById(world.quest.id)
        const tasks = (await world.taskStore.find({
            type: 'how-was-quest',
        })) as HowWasQuestTask[]
        expect(quest!.status).toEqual(QuestStatus.proposed)
        expect(onQuestAccepted).not.toHaveBeenCalled()
        expect(tasks.length).toBe(0)
    })
    it('FAILs to accept outdated proposal', async () => {
        const world = await setUp()
        await world.questNegotiation.proposeChange(world.defaultProposal)
        world.quest.time = Date.now() - 100_500_000
        await world.questStore.save(world.quest)
        await expectAsync(
            world.questNegotiation.acceptQuest({
                memberId: world.member2.id,
                questId: world.quest.id,
            })
        ).toBeRejectedWithError(InvalidAcceptanceTime)
    })
    it('FAILs to propose for not assigned member', async () => {
        const world = await setUp()
        await expectAsync(
            world.questNegotiation.proposeChange({
                ...world.defaultProposal,
                memberId: 'other-id',
            })
        ).toBeRejectedWithError(NotYourQuest)
    })
    it('FAILs to accept for not assigned member', async () => {
        const world = await setUp()
        await expectAsync(
            world.questNegotiation.acceptQuest({
                questId: world.quest.id,
                memberId: 'other-id',
            })
        ).toBeRejectedWithError(NotYourQuest)
    })
    it('re-assigns declined quest among upvoters', async () => {
        const world = await setUp()
        const onQuest = world.spyOnMessage<QuestMessage>('new-quest-message')
        await world.questNegotiation.declineQuest({
            memberId: world.member2.id,
            questId: world.quest.id,
        })
        expect(onQuest).toHaveBeenCalledWith(
            jasmine.objectContaining<QuestMessage>({
                type: 'new-quest-message',
                payload: jasmine.objectContaining<QuestMessage['payload']>({
                    description: world.quest.description,
                    targetUserId: jasmine.any(String),
                    questId: world.quest.id,
                }),
            })
        )
        const quest = await world.questStore.getById(world.quest.id)
        const message = onQuest.calls.argsFor(0)[0] as QuestMessage
        expect(world.upvoters).toContain(message.payload.targetUserId)
        expect(message.payload.targetUserId).not.toBe(world.member2.id)
        expect(message.payload.targetUserId).not.toBe(world.member1.id)
        expect(quest!.memberIds).toEqual([
            world.member1.id,
            message.payload.targetUserId,
        ])
        expect(quest!.memberIds).not.toContain(world.member2.id)
    })
    it('FAILs to decline first quest by original idea author', async () => {
        const world = await setUp()
        await expectAsync(
            world.questNegotiation.declineQuest({
                memberId: world.member1.id,
                questId: world.quest.id,
            })
        ).toBeRejectedWithError(IndeclinableError)
    })
    it('FAILs to decline "initiation" quest', async () => {
        const world = await setUp()
        world.quest.type = QuestType.initiation
        await world.questStore.save(world.quest)
        await expectAsync(
            world.questNegotiation.declineQuest({
                memberId: world.member1.id,
                questId: world.quest.id,
            })
        ).toBeRejectedWithError(IndeclinableError)
    })
})

async function setUp() {
    const context = await createContext()
    const { members, idea, upvoters } = await context.testing.makeIdea()
    const [member1, member2] = members
    const quest = await context.stores.questStore.save(
        new Quest({
            ideaId: idea.id,
            description: 'great quest!',
            memberIds: [member1.id, member2.id],
            time: Date.now() + 100_500_000,
        })
    )

    const questNegotiation = new QuestNegotiation(context)

    const defaultProposal = {
        questId: quest.id,
        memberId: member1.id,
        time: Date.now() + 100_500_000,
        place: 'the Foo Bar',
    }

    return {
        quest,
        member1,
        member2,
        upvoters,

        defaultProposal,
        questNegotiation,
        ...context.stores,
        spyOnMessage: context.testing.spyOnMessage,
    }
}
