import {
    IQuestData,
    NotYourQuest,
    Quest,
    QuestStatus,
    QuestType,
} from '../use-cases/entities/quest'
import { NoIdeaError } from '../use-cases/utils/get-root-idea'
import { QuestMessage } from '../use-cases/utils/quest-message'
import { QuestSource } from '../use-cases/quest-source'
import { Voting } from '../use-cases/vote-idea'
import { createContext, makeMessageSpy } from './test-context'

describe('Spawn a re-quest', () => {
    it('spawns a re-quest', async () => {
        const world = await setUp()
        await world.questSpawn.reQuest(world.defautlSpawnRequest)
        const newQuest = await world.getSpawnedQuest()
        expect(newQuest).toBeTruthy()
        expect(newQuest.memberIds).toEqual(world.quest.memberIds)
    })
    it('sets its parent to current quest', async () => {
        const world = await setUp()
        await world.questSpawn.reQuest(world.defautlSpawnRequest)
        const newQuest = await world.getSpawnedQuest()
        expect(newQuest.parentQuestId).toEqual(world.quest.id)
    })
    it('FAILs to span re-quest for not one of original members', async () => {
        const world = await setUp()
        await expectAsync(
            world.questSpawn.reQuest({
                ...world.defautlSpawnRequest,
                memberId: 'unnamed',
            })
        ).toBeRejectedWithError(NotYourQuest)
    })
})

describe('Spawn new quest', () => {
    it('spawns a new quest', async () => {
        const world = await setUp()
        await world.questSpawn.spawnQuest(world.defautlSpawnRequest)
        const newQuest = await world.getSpawnedQuest()
        expect(newQuest).toBeTruthy()
        expect(newQuest).toEqual(
            jasmine.objectContaining<IQuestData>({
                ideaId: null,
                description: world.defautlSpawnRequest.description,
                parentQuestId: world.quest.id,
                status: QuestStatus.proposed,
                memberIds: jasmine.any(Array),
                type: QuestType.coordination,
            })
        )
    })
    it('can spawn of a spawned quest', async () => {
        const world = await setUp()
        await world.questSpawn.spawnQuest(world.defautlSpawnRequest)
        const quest = await world.getSpawnedQuest()
        const description = 'ololo, next level shit!'
        await world.questSpawn.spawnQuest({
            description,
            memberId: quest.memberIds[0],
            parentQuestId: quest.id,
        })
        const newQuest = (await world.questStore.find({ description }))[0]
        expect(newQuest).toBeTruthy()
        expect(newQuest.memberIds.length).toEqual(2)
        const validMmebers = [...world.upvoters, world.idea.meberId]
        expect(validMmebers).toContain(newQuest.memberIds[0])
        expect(validMmebers).toContain(newQuest.memberIds[1])
    })
    it('FAILs if root quest has no idea attached', async () => {
        const world = await setUp()
        await world.questStore.save({ ...world.quest, ideaId: null })
        await expectAsync(
            world.questSpawn.spawnQuest(world.defautlSpawnRequest)
        ).toBeRejectedWithError(NoIdeaError)
    })
    it('notifies both members on a new quest proposal', async () => {
        const world = await setUp()
        const onQuest = world.spyOnMessage<QuestMessage>('new-quest-message')
        await world.questSpawn.spawnQuest(world.defautlSpawnRequest)
        const quest = await world.getSpawnedQuest()
        expect(onQuest).toHaveBeenCalledTimes(2)
        expect(onQuest).toHaveBeenCalledWith(
            jasmine.objectContaining<QuestMessage>({
                type: 'new-quest-message',
                payload: jasmine.objectContaining<QuestMessage['payload']>({
                    targetUserId: quest.memberIds[0],
                    questId: quest.id,
                    type: QuestType.coordination,
                    time: jasmine.any(Number),
                    place: '',
                }),
            })
        )
        expect(onQuest).toHaveBeenCalledWith(
            jasmine.objectContaining<QuestMessage>({
                payload: jasmine.objectContaining<QuestMessage['payload']>({
                    targetUserId: quest.memberIds[1],
                }),
            })
        )
    })
    describe('Assignment', () => {
        it('assigns quest to two members', async () => {
            const world = await setUp()
            await world.questSpawn.spawnQuest(world.defautlSpawnRequest)
            const quest = await world.getSpawnedQuest()
            expect(quest.memberIds.length).toEqual(2)
        })
        it('should pick only upvoters', async () => {
            const world = await setUp()
            await world.questSpawn.spawnQuest(world.defautlSpawnRequest)
            const quest = await world.getSpawnedQuest()
            expect(quest.memberIds).not.toContain(world.members[2].id)
            expect(quest.memberIds).not.toContain(world.members[5].id)
        })
        it('should NOT pick members of parent quest', async () => {
            const world = await setUp()
            await world.questSpawn.spawnQuest(world.defautlSpawnRequest)
            const quest = await world.getSpawnedQuest()
            expect(quest.memberIds).not.toContain(world.quest.memberIds[0])
            expect(quest.memberIds).not.toContain(world.quest.memberIds[1])
        })
        it('should still pick someone if there is not enough upvoters', async () => {
            const world = await setUp()
            await world.voting.voteDown(world.idea.id, world.members[3].id)
            await world.voting.voteDown(world.idea.id, world.members[4].id)
            await world.questSpawn.spawnQuest(world.defautlSpawnRequest)
            const quest = await world.getSpawnedQuest()
            expect(quest.memberIds.length).toEqual(2)
        })
    })
})

async function setUp() {
    const context = await createContext()
    const { members, idea, upvoters, downvoters } =
        await context.testing.makeIdea([1, 3, 4, 6], [2, 5])

    const voting = new Voting(context)
    const [member1, member2] = members
    const quest = await context.stores.questStore.save(
        new Quest({
            ideaId: idea.id,
            memberIds: [member1.id, member2.id],
            description: 'parent quest',
        })
    )

    const questSpawn = new QuestSource(context)

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
        quest,
        defautlSpawnRequest,
        idea,
        voting,
        upvoters,
        downvoters,
        ...context.stores,
        getSpawnedQuest: async () => {
            return (
                await context.stores.questStore.find({
                    description: defautlSpawnRequest.description,
                })
            )[0]
        },
        spyOnMessage: makeMessageSpy(context.async.notififcationBus),
    }
}
