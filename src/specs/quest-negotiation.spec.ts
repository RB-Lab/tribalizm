import { Member } from '../use-cases/entities/member'
import {
    CoordinationQuest,
    IndeclinableError,
    InvalidAcceptanceTime,
    InvalidTimeProposal,
    NotYourQuest,
    QuestStatus,
    QuestType,
} from '../use-cases/entities/quest'
import {
    QuestAcceptedMessage,
    QuestChangeMessage,
    QuestNegotiation,
} from '../use-cases/negotiate-quest'
import { NewCoordinationQuestMessage } from '../use-cases/spawn-quest'
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
                    proposingMemberId: world.member1.id,
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
            userId: world.user2.id,
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
            userId: world.user2.id,
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
            userId: world.user2.id,
        })
        const quest = await world.questStore.getById(world.quest.id)
        expect(onQuestAccepted).toHaveBeenCalledWith(
            jasmine.objectContaining<QuestAcceptedMessage>({
                type: 'quest-accepted',
                payload: jasmine.objectContaining<
                    QuestAcceptedMessage['payload']
                >({
                    description: (quest as any).description,
                    place: quest!.place!,
                    questId: quest!.id,
                    time: quest!.time!,
                    targetMemberId: world.member1.id,
                    targetUserId: world.user1.id,
                }),
            })
        )
    })
    it('waits until all parties accepted proposal', async () => {
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
            userId: member3.userId,
            questId: world.quest.id,
        })
        const quest = await world.questStore.getById(world.quest.id)
        expect(quest!.status).toEqual(QuestStatus.proposed)
        expect(onQuestAccepted).not.toHaveBeenCalled()
    })
    it('FAILs to accept outdated proposal', async () => {
        const world = await setUp()
        await world.questNegotiation.proposeChange(world.defaultProposal)
        world.quest.time = Date.now() - 100_500_000
        await world.questStore.save(world.quest)
        await expectAsync(
            world.questNegotiation.acceptQuest({
                userId: world.user2.id,
                questId: world.quest.id,
            })
        ).toBeRejectedWithError(InvalidAcceptanceTime)
    })
    it('FAILs to propose for not assigned member', async () => {
        const world = await setUp()
        await expectAsync(
            world.questNegotiation.proposeChange({
                ...world.defaultProposal,
                userId: world.users[4].id,
            })
        ).toBeRejectedWithError(NotYourQuest)
    })
    it('FAILs to accept for not assigned user', async () => {
        const world = await setUp()
        await expectAsync(
            world.questNegotiation.acceptQuest({
                questId: world.quest.id,
                userId: world.users[4].id,
            })
        ).toBeRejectedWithError(NotYourQuest)
    })
    it('re-assigns declined quest among upvoters', async () => {
        const world = await setUp()
        const onQuest = world.spyOnMessage<NewCoordinationQuestMessage>(
            'new-coordination-quest-message'
        )
        await world.questNegotiation.declineQuest({
            userId: world.user2.id,
            questId: world.quest.id,
        })
        expect(onQuest).toHaveBeenCalledWith(
            jasmine.objectContaining<NewCoordinationQuestMessage>({
                type: 'new-coordination-quest-message',
                payload: jasmine.objectContaining<
                    NewCoordinationQuestMessage['payload']
                >({
                    description: world.quest.description,
                    targetUserId: jasmine.any(String),
                    questId: world.quest.id,
                }),
            })
        )
        const quest = await world.questStore.getById(world.quest.id)
        const message = onQuest.calls.argsFor(
            0
        )[0] as NewCoordinationQuestMessage
        expect(world.upvoters).toContain(message.payload.targetMemberId)
        expect(message.payload.targetMemberId).not.toBe(world.member2.id)
        expect(message.payload.targetMemberId).not.toBe(world.member1.id)
        expect(quest!.memberIds).toEqual([
            world.member1.id,
            message.payload.targetMemberId,
        ])
        expect(quest!.memberIds).not.toContain(world.member2.id)
    })
    it('FAILs to decline first quest by original idea author', async () => {
        const world = await setUp()
        await expectAsync(
            world.questNegotiation.declineQuest({
                userId: world.user1.id,
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
                userId: world.user1.id,
                questId: world.quest.id,
            })
        ).toBeRejectedWithError(IndeclinableError)
    })

    it('shows quest details', async () => {
        const world = await setUp()
        const questView = await world.questNegotiation.questDetails({
            questId: world.quest.id,
        })
        expect(questView).toEqual({
            id: world.quest.id,
            description: world.quest.description,
            type: world.quest.type,
            participants: [
                {
                    userId: world.user1.id,
                    id: world.member1.id,
                    name: world.user1.name,
                },
                {
                    userId: world.user2.id,
                    id: world.member2.id,
                    name: world.user2.name,
                },
            ],
        })
    })
})

async function setUp() {
    const context = await createContext()
    const { members, idea, upvoters, users } = await context.testing.makeIdea()
    const [member1, member2] = members
    const [user1, user2] = users
    const quest = await context.stores.questStore.save(
        new CoordinationQuest({
            ideaId: idea.id,
            parentQuestId: null,
            description: 'great quest!',
            memberIds: [member1.id, member2.id],
            time: Date.now() + 100_500_000,
        })
    )

    const questNegotiation = new QuestNegotiation(context)

    const defaultProposal = {
        questId: quest.id,
        userId: user1.id,
        time: Date.now() + 100_500_000,
        place: 'the Foo Bar',
    }

    return {
        quest,
        member1,
        member2,
        user1,
        user2,
        users,
        members,
        upvoters,

        defaultProposal,
        questNegotiation,
        ...context.stores,
        spyOnMessage: context.testing.spyOnMessage,
    }
}
