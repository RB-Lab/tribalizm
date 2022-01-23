import { Awaited } from '../ts-utils'
import { TribeApplication } from '../use-cases/apply-tribe'
import {
    IQuest,
    IQuestData,
    isIntroductionQuest,
    QuestType,
    SavedQuest,
} from '../use-cases/entities/quest'
import { User } from '../use-cases/entities/user'
import { Initiation } from '../use-cases/initiation'
import { QuestNegotiation } from '../use-cases/negotiate-quest'
import {
    isInitiationFeedbackTask,
    isIntroductionTask,
} from '../use-cases/utils/scheduler'
import { createContext, makeMessageSpy } from './test-context'

describe('Initiation quests:', () => {
    // TODO what to do if user ignores?
    it('marks feedback tasks "done"', async () => {
        const world = await setUp()
        const task = await world.applyToTribe().then(world.spinQuest)
        expect(task.done).toBe(false)
        await world.initiation.notifyElder(task)
        const taskAfter = await world.taskStore.getById(task.id)
        expect(taskAfter!.done).toBe(true)
    })
    it("marks candidate as a full-blown member when they're accepted", async () => {
        const world = await setUp()
        const { quest, newMember } = await world.applyToTribe()

        await world.approve({ quest }).then(world.approve).then(world.approve)

        const nmAfter = await world.memberStore.getById(newMember.id)
        expect(nmAfter?.isCandidate).toBe(false)
    })
    it('accepts the candidate after one approval if no  more members in tribe', async () => {
        const world = await setUp(1)
        const { newMember, quest } = await world.applyToTribe()
        await world.approve({ quest })
        const member = await world.memberStore.getById(newMember.id)
        expect(member?.isCandidate).toBe(false)
    })
    it('accepts the candidate after two approval if no more members in tribe', async () => {
        const world = await setUp(2)
        const { newMember, quest } = await world.applyToTribe()
        await world.approve({ quest }).then(world.approve)
        const member = await world.memberStore.getById(newMember.id)
        expect(member?.isCandidate).toBe(false)
    })
    it('schedules intro quest', async () => {
        const world = await setUp()
        await world
            .applyToTribe()
            .then(world.approve)
            .then(world.approve)
            .then(world.approve)
        const introTask = await world.taskStore._last()

        expect(isIntroductionTask(introTask)).toBe(true)
    })
    it("schedules intro quest for those who didn't attend in initiation", async () => {
        const world = await setUp()
        await world
            .applyToTribe()
            .then(world.approve)
            .then(world.approve)
            .then(world.approve)
        const allInitiationQuests = await world.questStore.findSimple({
            type: QuestType.initiation,
        })
        const oldiesAndNewMember = [
            ...new Set(allInitiationQuests.flatMap((q) => q.memberIds)),
        ]
        const introTask = await world.taskStore._last()
        if (!isIntroductionTask(introTask)) {
            throw new Error('not an intro task')
        }
        expect(oldiesAndNewMember).not.toContain(introTask.payload.oldMemberId)
    })
    it('DOES NOT schedule intro quest when not enough members in tribe', async () => {
        const world = await setUp(3)
        await world
            .applyToTribe()
            .then(world.approve)
            .then(world.approve)
            .then(world.approve)
        const introTask = await world.taskStore._last()

        expect(isIntroductionTask(introTask)).toBe(false)
    })
    it('finalizes accepted application', async () => {
        const world = await setUp()
        await world
            .applyToTribe()
            .then(world.approve)
            .then(world.approve)
            .then(world.approve)
        const application = await world.applicationStore._last()

        expect(application.status).toBe('approved')
    })
    // TODO ensure that declined user cannot fill the application again straight away
    // TODO add "skip": swap random member in that case
    describe('Decline', () => {
        it('finalizes declined application', async () => {
            const world = await setUp()
            const { application, newMember, quest, oldie } =
                await world.applyToTribe()
            await world.initiation.decline({
                questId: quest.id,
                userId: oldie.userId,
            })
            const app = await world.applicationStore.getById(application.id)

            const member = await world.memberStore.getById(newMember.id)
            expect(app!.status).toEqual('declined')
            expect(member!.isCandidate)
                .withContext('member.isCandidate')
                .toEqual(true)
        })
    })
})

async function setUp(tribeCount?: number) {
    const context = await createContext()
    const { members, tribe, users } = await context.testing.makeTribe(
        tribeCount
    )
    const user = await context.stores.userStore.save(
        new User({
            name: 'New user',
        })
    )
    const tribeApp = new TribeApplication(context)

    const initiation = new Initiation(context)
    async function applyToTribe() {
        await tribeApp.applyToTribe({
            coverLetter: 'foo',
            userId: user!.id,
            tribeId: tribe.id,
        })
        const application = await context.stores.applicationStore._last()
        const quest = await context.stores.questStore._last()
        return {
            application,
            quest,
            newMember: await getNewbie(quest),
            oldie: getOldie(quest),
        }
    }
    function getOldie(quest: IQuestData) {
        // only one of two quest attenders is in tribe original members
        return members.filter((m) => quest.memberIds.includes(m.id))[0]
    }
    async function getNewbie(quest: IQuestData) {
        const oldie = getOldie(quest)
        const newbieId = quest.memberIds.find((id) => id !== oldie.id)!
        return (await context.stores.memberStore.getById(newbieId))!
    }

    const spinQuest = async ({ quest }: { quest: SavedQuest }) => {
        const negotiation = new QuestNegotiation(context)
        await negotiation.proposeChange({
            userId: getOldie(quest).userId,
            place: 'any',
            questId: quest.id,
            time: Date.now() + 100_500_500,
        })
        await negotiation.acceptQuest({
            questId: quest.id,
            userId: (await getNewbie(quest)).userId,
        })
        const task = await context.stores.taskStore._last()
        if (!isInitiationFeedbackTask(task)) {
            throw new Error(`wrong type of task: ${task.type}`)
        }
        return task
    }
    return {
        applyToTribe,
        getOldie,
        spinQuest,
        approve: async ({ quest }: { quest: SavedQuest }) => {
            const task = await spinQuest({ quest })
            const oldie = getOldie(quest)
            await initiation.notifyElder(task)
            await initiation.approve({
                questId: quest.id,
                userId: oldie.userId,
            })
            return {
                quest: await context.stores.questStore._last(),
            }
        },
        tribe,
        users,
        members,
        user,
        initiation,
        ...context.async,
        ...context.stores,
        context,
        spyOnMessage: makeMessageSpy(context.async.notificationBus),
    }
}
