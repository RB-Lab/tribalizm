import { Member } from '../use-cases/entities/member'
import {
    NotYourQuest,
    Quest,
    SelfVotingError,
    VoteRangeError,
} from '../use-cases/entities/quest'
import { User } from '../use-cases/entities/user'
import { EntityNotFound } from '../use-cases/utils/not-found-error'
import { QuestFinale } from '../use-cases/quest-finale'
import { createContext } from './test-context'

describe('Quest finale', () => {
    it('FAILs to finalyse by not quest assignee', async () => {
        const world = await setUp()
        await expectAsync(
            world.questFinale.imDone({
                questId: world.quest.id,
                memberId: 'not-assigned',
            })
        ).toBeRejectedWithError(NotYourQuest)
    })
    it('FAILs to finalyse non-existing quest', async () => {
        const world = await setUp()
        await expectAsync(
            world.questFinale.imDone({
                questId: 'non-existing',
                memberId: world.member2.id,
            })
        ).toBeRejectedWithError(EntityNotFound)
    })
    it('marks quest as done for the memeber', async () => {
        const world = await setUp()
        await world.questFinale.imDone(world.defaultFinalReq)
        const quest = await world.questStore.getById(world.quest.id)
        expect(quest!.finishedIds).toEqual([world.member1.id])
    })
    it('gives next member to vote on', async () => {
        const world = await setUp()
        await world.questFinale.imDone(world.defaultFinalReq)
        const action = await world.questFinale.getNextVoteAction(
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
                world.questFinale[method]({
                    ...world.defaultCastRequest,
                    memberId: 'not-a-member',
                })
            ).toBeRejectedWithError(NotYourQuest)
        })
        it('FAILs to cast for self', async () => {
            const world = await setUp()
            await expectAsync(
                world.questFinale[method]({
                    ...world.defaultCastRequest,
                    voteForId: world.defaultCastRequest.memberId,
                    charisma: 7,
                })
            ).toBeRejectedWithError(SelfVotingError)
        })
        it('FAILs to cast more than 10 or less than 1', async () => {
            const world = await setUp()
            await expectAsync(
                world.questFinale[method]({
                    ...world.defaultCastRequest,
                    charisma: 132,
                    wisdom: 132,
                })
            ).toBeRejectedWithError(VoteRangeError)
            await expectAsync(
                world.questFinale[method]({
                    ...world.defaultCastRequest,
                    charisma: -1,
                    wisdom: -1,
                })
            ).toBeRejectedWithError(VoteRangeError)
        })
        it(`requires vote for ${otherTrait} when done`, async () => {
            const world = await setUp()
            await world.questFinale[method]({
                ...world.defaultCastRequest,
            })
            const action = await world.questFinale.getNextVoteAction(
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
            await world.questFinale[method]({
                ...world.defaultCastRequest,
            })
            const member2 = await world.memberStore.getById(world.member2.id)
            expect(member2?.votes.length).toEqual(0)
        })
        it(`casts vote, if ${otherTrait} already set`, async () => {
            const world = await setUp()
            await world.questFinale[otherMethod]({
                ...world.defaultCastRequest,
            })
            await world.questFinale[method]({
                ...world.defaultCastRequest,
            })
            const member2 = await world.memberStore.getById(world.member2.id)
            expect(member2?.votes.length).toEqual(1)
            const vote = member2!.votes[0]
            expect(vote).toEqual({
                type: 'quest-vote',
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
        await world.questFinale.castCharisma({
            ...world.defaultFinalReq,
            charisma: 7,
        })
        await world.questFinale.castWisdom({
            ...world.defaultFinalReq,
            wisdom: 7,
        })
        const nextAction = await world.questFinale.getNextVoteAction(
            world.defaultFinalReq
        )
        expect(nextAction?.memberId).toEqual(world.member3.id)
    })
    it('gives no member when done', async () => {
        const world = await setUp()
        await world.questFinale.castCharisma({
            ...world.defaultFinalReq,
            charisma: 7,
        })
        await world.questFinale.castWisdom({
            ...world.defaultFinalReq,
            wisdom: 7,
        })
        expect(
            await world.questFinale.getNextVoteAction(world.defaultFinalReq)
        ).toBe(null)
    })

    it('applies scores when 5 votes casted', async () => {
        const world = await setUp()
        let member3 = await world.memberStore.getById(world.member3.id)
        expect(member3!.charisma).withContext('charisma').toEqual(0)
        expect(member3!.wisdom).withContext('wisdom').toEqual(0)
        await world.castVotes(world.member1.id, world.member3.id, [5, 5, 5])
        await world.castVotes(world.member2.id, world.member3.id, [5, 5])
        member3 = await world.memberStore.getById(world.member3.id)
        expect(member3!.charisma).withContext('charisma').toEqual(10)
        expect(member3!.wisdom).withContext('wisdom').toEqual(10)
    })
    it('does NOT count before 5 votes casted', async () => {
        const world = await setUp()
        await world.castVotes(world.member1.id, world.member2.id, [5, 5, 5])
        await world.castVotes(world.member3.id, world.member2.id, [5, 5])
        let member2 = await world.memberStore.getById(world.member2.id)
        expect(member2!.charisma).withContext('charisma').toEqual(10)
        expect(member2!.wisdom).withContext('wisdom').toEqual(10)
        await world.castVotes(world.member1.id, world.member2.id, [2, 2])
        await world.castVotes(world.member3.id, world.member2.id, [2, 2])
        member2 = await world.memberStore.getById(world.member2.id)
        expect(member2!.charisma).withContext('charisma').toEqual(10)
        expect(member2!.wisdom).withContext('wisdom').toEqual(10)
    })
    it('assignes mean for one memeber votes', async () => {
        const world = await setUp()
        const ch1 = [1, 2, 3, 4, 5]
        const w1 = [2, 2, 3, 4, 4]
        const ch2 = [3, 2, 3, 3, 2]
        const w2 = [2, 5, 3, 4, 5]
        await world.castVotes(world.member1.id, world.member2.id, ch1, w1)
        await world.castVotes(world.member3.id, world.member2.id, ch2, w2)
        const member2 = await world.memberStore.getById(world.member2.id)
        expect(member2!.charisma)
            .withContext('charisma')
            .toEqual(mean(ch1) + mean(ch2))
        expect(member2!.wisdom)
            .withContext('wisdom')
            .toEqual(mean(w1) + mean(w2))
    })

    it('makes a new most charismatic member chief', async () => {
        const world = await setUp()
        const oldChief = await world.memberStore.getById(world.tribe.chiefId!)
        const arr = new Array(5).fill(0)
        const votes = arr.map((_) => oldChief!.charisma + 1)
        await world.castVotes(world.member1.id, world.member3.id, votes, arr)
        const member3 = await world.memberStore.getById(world.member3.id)
        expect(member3!.charisma).toBeGreaterThan(oldChief!.charisma)
        const tribe = await world.tribeStore.getById(world.tribe.id)
        expect(tribe!.chiefId).toEqual(member3!.id)
    })
    it('makes a new most wise member shaman', async () => {
        const world = await setUp()
        const oldShaman = await world.memberStore.getById(world.tribe.shamanId!)
        const arr = new Array(5).fill(0)
        const votes = arr.map((_) => oldShaman!.wisdom + 1)
        await world.castVotes(world.member1.id, world.member3.id, arr, votes)
        const member3 = await world.memberStore.getById(world.member3.id)
        expect(member3!.wisdom).toBeGreaterThan(oldShaman!.wisdom)
        const tribe = await world.tribeStore.getById(world.tribe.id)
        expect(tribe!.shamanId).toEqual(member3!.id)
    })
})

function mean(arr: number[]) {
    return arr.reduce((s, n) => s + n, 0) / arr.length
}

async function setUp() {
    const context = createContext()
    const { members, users, tribe } = await context.testing.makeTribe()

    const [member1, member2, member3] = members
    const [user1, user2, user3] = users
    const quest = await context.stores.questStore.save(
        new Quest({ memberIds: [member1.id, member2.id] })
    )

    const questFinale = new QuestFinale(context)
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
        questFinale,
        member1,
        member2,
        member3,
        user1,
        user2,
        user3,
        quest,
        tribe,
        defaultFinalReq,
        defaultCastRequest,
        spyOnMessage: context.testing.spyOnMessage,
        castVotes: async (
            memberId: string,
            voteForId: string,
            votesCharisma: number[],
            votesWisdom?: number[]
        ) =>
            Promise.all(
                votesCharisma.map(async (v, i) => {
                    const quest = await context.stores.questStore.save(
                        new Quest({ memberIds: [memberId, voteForId] })
                    )
                    await questFinale.castCharisma({
                        voteForId,
                        memberId,
                        questId: quest.id,
                        charisma: v,
                    })
                    await questFinale.castWisdom({
                        voteForId,
                        memberId,
                        questId: quest.id,
                        wisdom: votesWisdom ? votesWisdom[i] : v,
                    })
                })
            ),
    }
}
