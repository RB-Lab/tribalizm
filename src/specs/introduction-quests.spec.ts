import { mapify } from '../ts-utils'
import { TribeApplication } from '../use-cases/apply-tribe'
import { IQuestData, QuestStatus, QuestType } from '../use-cases/entities/quest'
import { Storable } from '../use-cases/utils/store'
import { User } from '../use-cases/entities/user'
import { Initiation } from '../use-cases/initiation'
import {
    IntroductionQuests,
    IntroMessage,
} from '../use-cases/introduction-quests'
import { QuestNegotiation } from '../use-cases/negotiate-quest'
import {
    IntroductionTask,
    isIntroductionTask,
} from '../use-cases/utils/scheduler'
import { createContext } from './test-context'

describe('Introduction quests', () => {
    it('allocates introduction task on member approval', async () => {
        const world = await setUp()
        const newMember = await world.getApproval()
        const tasks = await world.taskStore.findSimple({
            type: 'introduction-quest',
        })
        expect(tasks.length).toBe(1)
        expect(tasks[0]).toEqual(
            jasmine.objectContaining<IntroductionTask>({
                type: 'introduction-quest',
                done: false,
                time: jasmine.any(Number),
                payload: {
                    newMemberId: newMember.id,
                    oldMemberId: jasmine.any(String),
                },
            })
        )
        const task = tasks[0] as IntroductionTask
        expect(task.time).toBeGreaterThan(Date.now() + 19 * 3_600_000)
        expect(task.time).toBeLessThan(Date.now() + 21 * 3_600_000)
        expect(world.members.map((m) => m.id)).toContain(
            task.payload.oldMemberId
        )
    })
    it('marks an introduction task done', async () => {
        const world = await setUp()
        await world.getApproval()
        const { task } = await world.makeIntroTask()
        await world.introQuests.notifyOldMember(task)
        const taskAfter = await world.taskStore.getById(task.id)
        expect(taskAfter?.done).toBe(true)
    })
    it('notifies old member when it`s time for intro', async () => {
        const world = await setUp()
        const newMember = await world.getApproval()
        const { task, oldMember } = await world.makeIntroTask()
        const onQuest = world.spyOnMessage<IntroMessage>(
            'intro-request-message'
        )
        await world.introQuests.notifyOldMember(task)
        const quest = await world.questStore._last()
        expect(onQuest).toHaveBeenCalledOnceWith(
            jasmine.objectContaining<IntroMessage>({
                type: 'intro-request-message',
                payload: {
                    targetUserId: oldMember.userId,
                    tribe: world.tribe.name,
                    questId: quest!.id,
                    newMemberName: world.user.name,
                },
            })
        )
    })
    it('creates an introduction quest', async () => {
        const world = await setUp()
        const newMember = await world.getApproval()
        const { oldMember, task } = await world.makeIntroTask()
        await world.introQuests.notifyOldMember(task)
        const quests = await world.questStore.findSimple({
            type: QuestType.introduction,
        })
        expect(quests.length).toBe(1)
        expect(quests[0].memberIds.length).toBe(2)
        expect(quests[0].memberIds).toEqual([oldMember!.id, newMember.id])
        expect(quests[0].status).toEqual(QuestStatus.proposed)
    })
    it('allocates next intro when parties agreed on current quest', async () => {
        const world = await setUp()
        await world.getApproval()
        const { next } = await world.makeIntroTask()
        const { task } = (await next())!
        expect(task).toBeTruthy()
        const tasks = await world.taskStore.findSimple({ done: false })
        expect(tasks.length).toBe(1)
        expect(isIntroductionTask(tasks[0])).toBe(true)
    })
    it('allocates next intro with a new member', async () => {
        const world = await setUp()
        const newMember = await world.getApproval()
        const { next, oldMember } = await world.makeIntroTask()
        const { task } = (await next())!
        expect(task!.payload.newMemberId).toEqual(newMember.id)
        expect(task!.payload.oldMemberId).not.toEqual(oldMember.id)
    })
    it('does NOT allocate intro with self', async () => {
        const world = await setUp()
        const newMember = await world.getApproval()
        const allTasks = await world.getAllTasks()
        expect(allTasks.length).toBeGreaterThan(1)
        const allNewMemberIds = allTasks.map((t) => t.payload.newMemberId)
        const allOldMemberIds = allTasks.map((t) => t.payload.oldMemberId)
        const uniqueNewMembers = [...new Set(allNewMemberIds)]
        expect(uniqueNewMembers.length).toBe(1)
        expect(uniqueNewMembers[0]).toBe(newMember.id)
        expect(allOldMemberIds).not.toContain(uniqueNewMembers[0])
    })
    it('does NOT allocate intro with initiation members', async () => {
        const world = await setUp()
        await world.getApproval()
        const allTasks = await world.getAllTasks()
        const allOldMemberIds = allTasks.map((t) => t.payload.oldMemberId)
        const initQuests = await world.questStore.findSimple({
            type: QuestType.initiation,
        })
        const allInitAttenders = initQuests.flatMap((q) => q.memberIds)
        for (let memberId of allInitAttenders) {
            expect(allOldMemberIds).not.toContain(memberId)
        }
    })
    it('allocates task for ALL regular members', async () => {
        const world = await setUp()
        await world.getApproval()
        const allTasks = await world.getAllTasks()
        const allOldRegularMembers = allTasks.map((t) => t.payload.oldMemberId)
        const initQuests = await world.questStore.findSimple({
            type: QuestType.initiation,
        })
        const allInitAttenders = initQuests.flatMap((q) => q.memberIds)
        const allMembers = world.members
            .map((m) => m.id)
            .filter((id) => !allInitAttenders.includes(id))
        expect(allOldRegularMembers.sort()).toEqual(allMembers.sort())
    })
    it('does NOT allocate a new task when all members have been met', () => {
        // this check is unnecessary, because `await world.getAllTasks()` will
        // never stops if this is not true
    })
})

async function setUp(size?: number) {
    const context = await createContext()
    const { members, tribe, users } = await context.testing.makeTribe(size)
    const user = await context.stores.userStore.save(
        new User({ name: 'new user' })
    )

    const initiation = new Initiation(context)
    const tribeApplication = new TribeApplication(context)
    const introQuests = new IntroductionQuests(context)
    const negotiation = new QuestNegotiation(context)

    function getOldieByQuest(quest: IQuestData) {
        // only one of two quest attenders is in tribe original members
        return members.filter((m) => quest.memberIds.includes(m.id))[0]
    }
    const getOldieByTask = (task: IntroductionTask) => {
        return members.filter((m) => m.id === task.payload.oldMemberId)[0]
    }

    const getApproval = async () => {
        await tribeApplication.applyToTribe({
            coverLetter: 'I want to FOO!',
            tribeId: tribe.id,
            userId: user.id,
        })
        const approvesNeeded = Math.min(members.length, 3)
        for (let i = 0; i < approvesNeeded; i++) {
            const initQuest = await context.stores.questStore._last()
            const oldie = getOldieByQuest(initQuest)
            await initiation.approve({
                questId: initQuest.id,
                userId: oldie.userId,
            })
        }

        return (
            await context.stores.memberStore.findSimple({ userId: user.id })
        )[0]
    }

    const getNewItroTask = async () => {
        const tasks = await context.stores.taskStore.findSimple({
            type: 'introduction-quest',
            done: false,
        })
        return tasks.length ? (tasks[0] as IntroductionTask & Storable) : null
    }
    const makeAndAcceptQuest = async (task: IntroductionTask & Storable) => {
        const negotiation = new QuestNegotiation(context)
        await introQuests.notifyOldMember(task)
        const quest = await context.stores.questStore._last()
        const oldie = (await context.stores.memberStore.getById(
            task.payload.oldMemberId
        ))!
        const newbie = (await context.stores.memberStore.getById(
            task.payload.newMemberId
        ))!
        await negotiation.proposeChange({
            userId: oldie.userId,
            place: 'any',
            questId: quest.id,
            time: Date.now() + 100_500_500,
        })
        await negotiation.acceptQuest({
            questId: quest.id,
            userId: newbie.userId,
        })
    }
    const makeIntroTask = async () => {
        let task = (await getNewItroTask())!
        const next = async () => {
            await makeAndAcceptQuest(task)
            const newTask = await getNewItroTask()
            if (newTask) task = newTask
            return {
                oldMember: getOldieByTask(task),
                task: newTask,
                next,
            }
        }
        return {
            oldMember: getOldieByTask(task),
            task: task,
            next,
        }
    }

    const getAllTasks = async () => {
        let { task, next } = await makeIntroTask()
        const allTasks = [task]
        while (true) {
            const res = await next()
            if (!res.task) break
            task = res.task
            next = res.next
            allTasks.push(task)
        }
        return allTasks
    }

    return {
        ...context.stores,
        members,
        tribe,
        user,
        users,
        introQuests,
        initiation,
        negotiation,
        app: tribeApplication,
        getApproval,
        makeIntroTask,
        getAllTasks,
        spyOnMessage: context.testing.spyOnMessage,
    }
}
