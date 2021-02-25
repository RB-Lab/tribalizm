import { Member } from '../use-cases/entities/member'
import {
    NotYourQuest,
    Quest,
    SelfVotingError,
    VoteRangeError,
} from '../use-cases/entities/quest'
import { User } from '../use-cases/entities/user'
import { EntityNotFound } from '../use-cases/not-found-error'
import { QuestFinal } from '../use-cases/quest-final'
import { createContext, makeMessageSpy } from './test-context'

describe('Non-execution quest finale', () => {
    it('FAILs to finalyse by not quest assignee', async () => {
        const world = await setUp()
        await expectAsync(
            world.questFinal.imDone({
                questId: world.quest.id,
                memberId: 'not-assigned',
            })
        ).toBeRejectedWithError(NotYourQuest)
    })
    it('FAILs to finalyse non-existing quest', async () => {
        const world = await setUp()
        await expectAsync(
            world.questFinal.imDone({
                questId: 'non-existing',
                memberId: world.member2.id,
            })
        ).toBeRejectedWithError(EntityNotFound)
    })
    it('marks quest as done for the memeber', async () => {
        const world = await setUp()
        await world.questFinal.imDone(world.defaultFinalReq)
        const quest = await world.questStore.getById(world.quest.id)
        expect(quest!.finishedIds).toEqual([world.member1.id])
    })
    it('gives next member to vote on', async () => {
        const world = await setUp()
        await world.questFinal.imDone(world.defaultFinalReq)
        const action = await world.questFinal.getNextVoteAction(
            world.defaultFinalReq
        )
        expect(action).toEqual({
            memberId: world.member2.id,
            action: 'charisma',
            memberName: world.user2.name,
        })
    })

    function runCastTests(trait: 'charisma' | 'wisdom') {
        const otherTrait = trait === 'charisma' ? 'wisdom' : 'charisma'
        const method = trait === 'charisma' ? 'castCharisma' : 'castWisdom'
        const otherMethod = trait === 'charisma' ? 'castWisdom' : 'castCharisma'

        it('FAILs to cast by not quest assignee', async () => {
            const world = await setUp()
            await expectAsync(
                world.questFinal[method]({
                    ...world.defaultCastRequest,
                    memberId: 'not-a-member',
                })
            ).toBeRejectedWithError(NotYourQuest)
        })
        it('FAILs to cast for self', async () => {
            const world = await setUp()
            await expectAsync(
                world.questFinal[method]({
                    ...world.defaultCastRequest,
                    voteForId: world.defaultCastRequest.memberId,
                    charisma: 7,
                })
            ).toBeRejectedWithError(SelfVotingError)
        })
        it('FAILs to cast more than 10 or less than 1', async () => {
            const world = await setUp()
            await expectAsync(
                world.questFinal[method]({
                    ...world.defaultCastRequest,
                    charisma: 132,
                    wisdom: 132,
                })
            ).toBeRejectedWithError(VoteRangeError)
            await expectAsync(
                world.questFinal[method]({
                    ...world.defaultCastRequest,
                    charisma: -1,
                    wisdom: -1,
                })
            ).toBeRejectedWithError(VoteRangeError)
        })
        it(`requires vote for ${otherTrait} when done`, async () => {
            const world = await setUp()
            await world.questFinal[method]({
                ...world.defaultCastRequest,
            })
            const action = await world.questFinal.getNextVoteAction(
                world.defaultCastRequest
            )
            expect(action).toEqual({
                memberId: world.member2.id,
                action: otherTrait,
                memberName: world.user2.name,
            })
        })
        it(`should not cast vote when ${otherTrait} is not casted yet`, async () => {
            const world = await setUp()
            await world.questFinal[method]({
                ...world.defaultCastRequest,
            })
            const member2 = await world.memberStore.getById(world.member2.id)
            expect(member2?.votes.length).toEqual(0)
        })
        it(`casts vote, if ${otherTrait} already set`, async () => {
            const world = await setUp()
            await world.questFinal[otherMethod]({
                ...world.defaultCastRequest,
            })
            await world.questFinal[method]({
                ...world.defaultCastRequest,
            })
            const member2 = await world.memberStore.getById(world.member2.id)
            expect(member2?.votes.length).toEqual(1)
            const vote = member2!.votes[0]
            expect(vote).toEqual({
                charisma: 7,
                wisdom: 7,
                memberId: world.member1.id,
                questId: world.quest.id,
                casted: jasmine.any(Number),
            })
            expect(vote.casted).toBeGreaterThan(Date.now() - 1000)
            expect(vote.casted).toBeLessThan(Date.now() + 1000)
        })
    }
    describe('Charisma cast', () => {
        runCastTests('charisma')
    })
    describe('Wisdom cast', () => {
        runCastTests('wisdom')
    })
    it('requests cast for next member, when first is done', async () => {
        const world = await setUp()
        world.quest.memberIds.push(world.member3.id)
        await world.questStore.save(world.quest)
        await world.questFinal.castCharisma({
            ...world.defaultFinalReq,
            charisma: 7,
        })
        await world.questFinal.castWisdom({
            ...world.defaultFinalReq,
            wisdom: 7,
        })
        const nextAction = await world.questFinal.getNextVoteAction(
            world.defaultFinalReq
        )
        expect(nextAction?.memberId).toEqual(world.member3.id)
    })
    it('gives no member when done', async () => {
        const world = await setUp()
        await world.questFinal.castCharisma({
            ...world.defaultFinalReq,
            charisma: 7,
        })
        await world.questFinal.castWisdom({
            ...world.defaultFinalReq,
            wisdom: 7,
        })
        expect(
            await world.questFinal.getNextVoteAction(world.defaultFinalReq)
        ).toBe(null)
    })
})

async function setUp() {
    const context = createContext()
    const user1 = await context.stores.userStore.save(
        new User({ name: 'User A' })
    )
    const user2 = await context.stores.userStore.save(
        new User({ name: 'User B' })
    )
    const user3 = await context.stores.userStore.save(
        new User({ name: 'User C' })
    )
    const [
        member1,
        member2,
        member3,
    ] = await context.stores.memberStore.saveBulk([
        new Member({ tribeId: 'tribe', userId: user1.id }),
        new Member({ tribeId: 'tribe', userId: user2.id }),
        new Member({ tribeId: 'tribe', userId: user2.id }),
    ])

    const quest = await context.stores.questStore.save(
        new Quest({ memberIds: [member1.id, member2.id] })
    )

    const questFinal = new QuestFinal(context)
    const defaultFinalReq = {
        memberId: member1.id,
        questId: quest.id,
        voteForId: member2.id,
    }
    const defaultCastRequest = {
        ...defaultFinalReq,
        charisma: 7,
        wisdom: 7,
    }

    return {
        ...context.stores,
        questFinal,
        member1,
        member2,
        member3,
        user1,
        user2,
        user3,
        quest,
        defaultFinalReq,
        defaultCastRequest,
        spyOnMessage: makeMessageSpy(context.async.notififcationBus),
    }
}
