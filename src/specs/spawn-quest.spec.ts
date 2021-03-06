import {
    CoordinationQuest,
    NotYourQuest,
    QuestStatus,
    QuestType
} from '../use-cases/entities/quest'
import {
    NewCoordinationQuestMessage,
    SpawnQuest
} from '../use-cases/spawn-quest'
import { NoIdeaError } from '../use-cases/utils/get-root-idea'
import { Voting } from '../use-cases/vote-idea'
import { createContext, makeMessageSpy } from './test-context'

describe('Spawn a re-quest', () => {
    it('spawns a re-quest', async () => {
        const world = await setUp()
        await world.questSpawn.reQuest(world.defaultSpawnRequest)
        const newQuest = await world.getSpawnedQuest()
        expect(newQuest).toBeTruthy()
        expect(newQuest.memberIds).toEqual(world.quest.memberIds)
    })
    it('sets its parent to current quest', async () => {
        const world = await setUp()
        await world.questSpawn.reQuest(world.defaultSpawnRequest)
        const newQuest = await world.getSpawnedQuest()
        expect(newQuest.parentQuestId).toEqual(world.quest.id)
    })
    it('FAILs to span re-quest for not one of original members', async () => {
        const world = await setUp()
        await expectAsync(
            world.questSpawn.reQuest({
                ...world.defaultSpawnRequest,
                memberId: 'unnamed',
            })
        ).toBeRejectedWithError(NotYourQuest)
    })
})

describe('Spawn new quest', () => {
    it('spawns a new quest', async () => {
        const world = await setUp()
        await world.questSpawn.spawnQuest(world.defaultSpawnRequest)
        const newQuest = await world.getSpawnedQuest()
        expect(newQuest).toBeTruthy()
        expect(newQuest).toEqual(
            jasmine.objectContaining<CoordinationQuest>({
                ideaId: null,
                description: world.defaultSpawnRequest.description,
                parentQuestId: world.quest.id,
                status: QuestStatus.proposed,
                memberIds: jasmine.any(Array),
                type: QuestType.coordination,
            })
        )
    })
    it('can spawn of a spawned quest', async () => {
        const world = await setUp()
        await world.questSpawn.spawnQuest(world.defaultSpawnRequest)
        const quest = await world.getSpawnedQuest()
        const description = 'ololo, next level shit!'
        await world.questSpawn.spawnQuest({
            description,
            memberId: quest.memberIds[0],
            parentQuestId: quest.id!,
        })
        // @ts-ignore
        const newQuest = (await world.questStore.findSimple({ description }))[0]
        expect(newQuest).toBeTruthy()
        expect(newQuest.memberIds.length).toEqual(2)
        const validMembers = [...world.upvoters, world.idea.memberId]
        expect(validMembers).toContain(newQuest.memberIds[0])
        expect(validMembers).toContain(newQuest.memberIds[1])
    })
    it('FAILs if root quest has no idea attached', async () => {
        const world = await setUp()
        await world.questStore.save({ ...world.quest, ideaId: null })
        await expectAsync(
            world.questSpawn.spawnQuest(world.defaultSpawnRequest)
        ).toBeRejectedWithError(NoIdeaError)
    })

    it('notifies both members on a new quest proposal', async () => {
        const world = await setUp()
        const onQuest = world.spyOnMessage<NewCoordinationQuestMessage>(
            'new-coordination-quest-message'
        )
        await world.questSpawn.spawnQuest(world.defaultSpawnRequest)
        const quest = await world.getSpawnedQuest()
        expect(onQuest).toHaveBeenCalledTimes(2)
        const member1 = await world.memberStore.getById(quest.memberIds[0])
        const member2 = await world.memberStore.getById(quest.memberIds[1])
        const user1 = await world.userStore.getById(member1!.userId)
        const user2 = await world.userStore.getById(member2!.userId)
        expect(onQuest).toHaveBeenCalledWith(
            jasmine.objectContaining<NewCoordinationQuestMessage>({
                type: 'new-coordination-quest-message',
                payload: jasmine.objectContaining<
                    NewCoordinationQuestMessage['payload']
                >({
                    targetUserId: user1?.id,
                    targetMemberId: member1?.id,
                    questId: quest.id,
                    description: quest.description,
                    members: jasmine.arrayWithExactContents([
                        jasmine.objectContaining({
                            id: member1?.id,
                            name: user1?.name,
                        }),
                        jasmine.objectContaining({
                            id: member2?.id,
                            name: user2?.name,
                        }),
                    ]),
                }),
            })
        )
        expect(onQuest).toHaveBeenCalledWith(
            jasmine.objectContaining<NewCoordinationQuestMessage>({
                payload: jasmine.objectContaining<
                    NewCoordinationQuestMessage['payload']
                >({
                    targetUserId: user2?.id,
                    targetMemberId: member2?.id,
                }),
            })
        )
    })

    describe('Assignment', () => {
        it('assigns quest to two members', async () => {
            const world = await setUp()
            await world.questSpawn.spawnQuest(world.defaultSpawnRequest)
            const quest = await world.getSpawnedQuest()
            expect(quest.memberIds.length).toEqual(2)
        })
        it('should pick only upvoters', async () => {
            const world = await setUp()
            await world.questSpawn.spawnQuest(world.defaultSpawnRequest)
            const quest = await world.getSpawnedQuest()
            expect(quest.memberIds).not.toContain(world.members[2].id)
            expect(quest.memberIds).not.toContain(world.members[5].id)
        })
        it('should NOT pick members of parent quest', async () => {
            const world = await setUp()
            await world.questSpawn.spawnQuest(world.defaultSpawnRequest)
            const quest = await world.getSpawnedQuest()
            expect(quest.memberIds).not.toContain(world.quest.memberIds[0])
            expect(quest.memberIds).not.toContain(world.quest.memberIds[1])
        })
        it('should still pick someone if there is not enough upvoters', async () => {
            const world = await setUp()
            await world.voting.voteDown(world.idea.id, world.members[3].userId)
            await world.voting.voteDown(world.idea.id, world.members[4].userId)
            await world.questSpawn.spawnQuest(world.defaultSpawnRequest)
            const quest = await world.getSpawnedQuest()
            expect(quest.memberIds.length).toEqual(2)
        })
    })
})

async function setUp() {
    const context = await createContext()
    const {
        members,
        idea,
        upvoters,
        downVoters: downVoters,
        users,
    } = await context.testing.makeIdea([1, 3, 4, 6], [2, 5])

    const voting = new Voting(context)
    const [member1, member2] = members
    const quest = await context.stores.questStore.save(
        new CoordinationQuest({
            parentQuestId: null,
            ideaId: idea.id,
            memberIds: [member1.id, member2.id],
            description: 'parent quest',
        })
    )

    const questSpawn = new SpawnQuest(context)

    const defautlSpawnRequest = {
        time: Date.now() + 24 * 3_600_000,
        place: 'Ololo cafe',
        description: "Let's ololo one more time!",
        parentQuestId: quest.id,
        memberId: member1.id,
    }

    return {
        questSpawn,
        member1,
        member2,
        members,
        users,
        quest,
        defaultSpawnRequest: defautlSpawnRequest,
        idea,
        voting,
        upvoters,
        downvoters: downVoters,
        ...context.stores,
        getSpawnedQuest: async () => {
            return (
                await context.stores.questStore.findSimple({
                    //@ts-ignore
                    description: defautlSpawnRequest.description,
                })
            )[0] as CoordinationQuest
        },
        spyOnMessage: makeMessageSpy(context.async.notificationBus),
    }
}
