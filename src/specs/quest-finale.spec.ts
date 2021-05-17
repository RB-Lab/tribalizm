import { SelfVotingError, VoteRangeError } from '../use-cases/entities/member'
import { NotYourQuest, Quest } from '../use-cases/entities/quest'
import { QuestFinale, QuestFinaleRequest } from '../use-cases/quest-finale'
import { EntityNotFound } from '../use-cases/utils/not-found-error'
import { createContext } from './test-context'

describe('Quest finale', () => {
    it('FAILs to finalyse by not quest assignee', async () => {
        const world = await setUp()
        await expectAsync(
            world.questFinale.finalyze({
                ...world.defaultFinalReq,
                memberId: 'not-assigned',
            })
        ).toBeRejectedWithError(NotYourQuest)
    })
    it('FAILs to finalyse non-existing quest', async () => {
        const world = await setUp()
        await expectAsync(
            world.questFinale.finalyze({
                ...world.defaultFinalReq,
                questId: 'non-existing',
            })
        ).toBeRejectedWithError(EntityNotFound)
    })
    it('marks quest as done for the memeber', async () => {
        const world = await setUp()
        await world.questFinale.finalyze(world.defaultFinalReq)
        const quest = await world.questStore.getById(world.quest.id)
        expect(quest!.finishedIds).toEqual([world.member1.id])
    })

    describe('Casting votes', () => {
        it('FAILs to cast for self', async () => {
            const world = await setUp()
            await expectAsync(
                world.questFinale.finalyze({
                    ...world.defaultFinalReq,
                    votes: [
                        {
                            ...world.defaultFinalReq.votes[0],
                            voteForId: world.defaultFinalReq.memberId,
                        },
                    ],
                })
            ).toBeRejectedWithError(SelfVotingError)
        })
        it('FAILs to cast more than 10 or less than 1', async () => {
            const world = await setUp()
            await expectAsync(
                world.questFinale.finalyze({
                    ...world.defaultFinalReq,
                    votes: [
                        {
                            ...world.defaultFinalReq.votes[0],
                            charisma: 132,
                            wisdom: 132,
                        },
                    ],
                })
            ).toBeRejectedWithError(VoteRangeError)
            await expectAsync(
                world.questFinale.finalyze({
                    ...world.defaultFinalReq,
                    votes: [
                        {
                            ...world.defaultFinalReq.votes[0],

                            charisma: -1,
                            wisdom: -1,
                        },
                    ],
                })
            ).toBeRejectedWithError(VoteRangeError)
        })
        it(`casts votes`, async () => {
            const world = await setUp()
            await world.questFinale.finalyze(world.defaultFinalReq)
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
    })

    describe('Computing scores', () => {
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
            const oldChief = await world.memberStore.getById(
                world.tribe.chiefId!
            )
            const arr = new Array(5).fill(0)
            const votes = arr.map((_) => oldChief!.charisma + 1)
            await world.castVotes(
                world.member1.id,
                world.member3.id,
                votes,
                arr
            )
            const member3 = await world.memberStore.getById(world.member3.id)
            expect(member3!.charisma).toBeGreaterThan(oldChief!.charisma)
            const tribe = await world.tribeStore.getById(world.tribe.id)
            expect(tribe!.chiefId).toEqual(member3!.id)
        })
        it('makes a new most wise member shaman', async () => {
            const world = await setUp()
            const oldShaman = await world.memberStore.getById(
                world.tribe.shamanId!
            )
            const arr = new Array(5).fill(0)
            const votes = arr.map((_) => oldShaman!.wisdom + 1)
            await world.castVotes(
                world.member1.id,
                world.member3.id,
                arr,
                votes
            )
            const member3 = await world.memberStore.getById(world.member3.id)
            expect(member3!.wisdom).toBeGreaterThan(oldShaman!.wisdom)
            const tribe = await world.tribeStore.getById(world.tribe.id)
            expect(tribe!.shamanId).toEqual(member3!.id)
        })
    })
})

function mean(arr: number[]) {
    return arr.reduce((s, n) => s + n, 0) / arr.length
}

async function setUp() {
    const context = await createContext()
    const { members, users, tribe } = await context.testing.makeTribe()

    const [member1, member2, member3] = members
    const [user1, user2, user3] = users
    const quest = await context.stores.questStore.save(
        new Quest({ memberIds: [member1.id, member2.id] })
    )

    const questFinale = new QuestFinale(context)
    const defaultFinalReq: QuestFinaleRequest = {
        memberId: member1.id,
        questId: quest.id,
        votes: [
            {
                voteForId: member2.id,
                charisma: 7,
                wisdom: 7,
            },
        ],
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
        spyOnMessage: context.testing.spyOnMessage,
        castVotes: async (
            memberId: string,
            voteForId: string,
            votesCharisma: number[],
            votesWisdom?: number[]
        ) => {
            for (let i in votesCharisma) {
                const quest = await context.stores.questStore.save(
                    new Quest({ memberIds: [memberId, voteForId] })
                )
                const wisdom = votesWisdom ? votesWisdom[i] : votesCharisma[i]
                await questFinale.finalyze({
                    memberId,
                    questId: quest.id,
                    votes: [{ voteForId, charisma: votesCharisma[i], wisdom }],
                })
            }
        },
    }
}
