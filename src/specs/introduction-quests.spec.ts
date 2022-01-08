import { mapify } from '../ts-utils'
import { TribeApplication } from '../use-cases/apply-tribe'
import { QuestStatus, QuestType } from '../use-cases/entities/quest'
import { Storable } from '../use-cases/utils/store'
import { User } from '../use-cases/entities/user'
import { Initiation } from '../use-cases/initiation'
import {
    IntroductionQuests,
    IntroMessage,
} from '../use-cases/introduction-quests'
import { QuestNegotiation } from '../use-cases/negotiate-quest'
import { IntroductionTask } from '../use-cases/utils/scheduler'
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
    it('does NOT allocate intro if only shaman & chief in tribe', async () => {
        const world = await setUp(2)
        await world.getApproval()
        const tasks = await world.taskStore.findSimple({
            type: 'introduction-quest',
        })
        expect(tasks.length).toBe(0)
    })
    it('marks an introduction task done', async () => {
        const world = await setUp()
        const newMember = await world.getApproval()
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
    it('allocates next intro when "how was it" done', async () => {
        const world = await setUp()
        const newMember = await world.getApproval()
        const { next } = await world.makeIntroTask()
        const { task } = (await next())!
        expect(task).toBeTruthy()
        const tasks = await world.taskStore.findSimple({ done: false })
        expect(tasks.length).toBe(1)
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
        const allNewMembers = allTasks.map((t) => t.payload.newMemberId)
        const allOldMembers = allTasks.map((t) => t.payload.oldMemberId)
        allNewMembers.forEach((m) => expect(m).toEqual(allNewMembers[0]))
        expect(allOldMembers).not.toContain(allNewMembers[0])
    })
    it('does NOT allocate intro with initiation members', async () => {
        fail('not implemented')
    })
    it('allocates task for ALL regular members', async () => {
        const world = await setUp()
        await world.getApproval()
        const allTasks = await world.getAllTasks()
        const allOldRegularMembers = allTasks.map((t) => t.payload.oldMemberId)
        const allMembers = world.members.map((m) => m.id)
        expect(allOldRegularMembers.sort()).toEqual(allMembers.sort())
    })
    it('allocates intro with a NEW chief', async () => {
        const world = await setUp()
        await world.getApproval()
        await world.tribeStore.save({
            ...world.tribe,
            chiefId: world.members[4].id,
        })
        const allTasks = await world.getAllTasks()
        const allOldRegularMembers = allTasks.map((t) => t.payload.oldMemberId)
        expect(allOldRegularMembers).toContain(world.members[4].id)
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

    const getApproval = async () => {
        await tribeApplication.applyToTribe({
            coverLetter: 'I want to FOO!',
            tribeId: tribe.id,
            userId: user.id,
        })
        const initQuest = await context.stores.questStore._last()
        const initReq = {
            questId: initQuest.id,
            userId: members[0].userId,
            place: 'The Foo Bar',
            time: 1_700_100_500_000,
        }
        // TODO spin the full initiation

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
    const getOldMember = (task: IntroductionTask | null) => {
        return task
            ? members.find((m) => m.id === task.payload.oldMemberId)
            : undefined
    }
    const makeIntroTask = async () => {
        let task = (await getNewItroTask())!
        const next = async () => {
            const membersMap = mapify(
                await context.stores.memberStore.findSimple({})
            )
            await introQuests.notifyOldMember(task)
            // TODO new task allocated after the former one??
            const newTask = await getNewItroTask()
            if (newTask) {
                task = newTask
                return {
                    oldMember: getOldMember(task)!,
                    task,
                    next,
                }
            }
            return null
        }
        return {
            oldMember: getOldMember(task)!,
            task: task,
            next,
        }
    }

    const getAllTasks = async () => {
        let { task, next } = await makeIntroTask()
        const allTasks = [task]
        while (true) {
            const res = await next()
            if (res) {
                task = res.task
                next = res.next
                allTasks.push(task)
            } else break
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
