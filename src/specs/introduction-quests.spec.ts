import { TribeApplication } from '../use-cases/apply-tribe'
import { QuestStatus, QuestType } from '../use-cases/entities/quest'
import { Storable } from '../use-cases/entities/store'
import { User } from '../use-cases/entities/user'
import { Initiation } from '../use-cases/initiation'
import {
    IntroductionQuests,
    IntroMessage,
} from '../use-cases/introduction-quests'
import { QuestNegotiation } from '../use-cases/negotiate-quest'
import { QuestFinale } from '../use-cases/quest-finale'
import { IntroductionTask } from '../use-cases/utils/scheduler'
import { createContext } from './test-context'

describe('Introduction quests', () => {
    it('allocates introduction task on member approval', async () => {
        const world = await setUp()
        const newMember = await world.getApproval()
        const tasks = await world.taskStore.find({ type: 'intorduction-quest' })
        expect(tasks.length).toBe(1)
        expect(tasks[0]).toEqual(
            jasmine.objectContaining<IntroductionTask>({
                type: 'intorduction-quest',
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
        const tasks = await world.taskStore.find({ type: 'intorduction-quest' })
        expect(tasks.length).toBe(0)
    })
    // FLICK??
    it('marks an introduction task done', async () => {
        const world = await setUp()
        const newMember = await world.getApproval()
        const { task } = await world.makeIntroTask(newMember.id)
        await world.introQuests.notifyOldMember(task)
        const taskAfter = await world.taskStore.getById(task.id)
        expect(taskAfter?.done).toBe(true)
    })
    it('notifies old member when it`s time for intro', async () => {
        const world = await setUp()
        const newMember = await world.getApproval()
        const { task, oldMember } = await world.makeIntroTask(newMember.id)
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
                    targetMemberId: oldMember!.id,
                    newMemberName: world.user.name,
                },
            })
        )
    })
    it('creates an introduction quest', async () => {
        const world = await setUp()
        const newMember = await world.getApproval()
        const { oldMember, task } = await world.makeIntroTask(newMember.id)
        await world.introQuests.notifyOldMember(task)
        const quests = await world.questStore.find({
            type: QuestType.introduction,
        })
        expect(quests.length).toBe(1)
        expect(quests[0].memberIds.length).toBe(2)
        expect(quests[0].memberIds).toEqual([oldMember!.id, newMember.id])
        expect(quests[0].status).toEqual(QuestStatus.proposed)
    })
    it('alocates next intro when "how was it" done', async () => {
        const world = await setUp()
        const newMember = await world.getApproval()
        const { next } = await world.makeIntroTask(newMember.id)
        const { task } = (await next())!
        expect(task).toBeTruthy()
        const tasks = await world.taskStore.find({ done: false })
        expect(tasks.length).toBe(1)
    })
    it('allocates next intro with a new member', async () => {
        const world = await setUp()
        const newMember = await world.getApproval()
        const { next, oldMember } = await world.makeIntroTask(newMember.id)
        const { task } = (await next())!
        expect(task!.payload.newMemberId).toEqual(newMember.id)
        expect(task!.payload.oldMemberId).not.toEqual(oldMember.id)
    })
    it('does NOT allocate intro with self', async () => {
        const world = await setUp()
        const newMember = await world.getApproval()
        const allTasks = await world.getAllTasks(newMember.id)
        expect(allTasks.length).toBeGreaterThan(1)
        const allNewMembers = allTasks.map((t) => t.payload.newMemberId)
        const allOldMembers = allTasks.map((t) => t.payload.oldMemberId)
        allNewMembers.forEach((m) => expect(m).toEqual(allNewMembers[0]))
        expect(allOldMembers).not.toContain(allNewMembers[0])
    })
    it('does NOT allocate intro with shaman & chief', async () => {
        const world = await setUp()
        const newMember = await world.getApproval()
        const allTasks = await world.getAllTasks(newMember.id)
        const allOldMembers = allTasks.map((t) => t.payload.oldMemberId)
        expect(allOldMembers).not.toContain(world.tribe.chiefId!)
        expect(allOldMembers).not.toContain(world.tribe.shamanId!)
    })
    fit('allocates task for ALL regular members', async () => {
        const world = await setUp()
        const newMember = await world.getApproval()
        const allTasks = await world.getAllTasks(newMember.id)
        // world.taskStore.__show(['id', 'type', 'done', 'payload'])
        const allOldRegularMembers = allTasks.map((t) => t.payload.oldMemberId)
        const allOldMembers = [
            ...allOldRegularMembers,
            world.tribe.shamanId,
            world.tribe.chiefId,
        ]
        const allMembers = world.members.map((m) => m.id)
        expect(allOldMembers.sort()).toEqual(allMembers.sort())
    })
    it('allocates intro with a NEW chief', async () => {
        const world = await setUp()
        const newMember = await world.getApproval()
        await world.tribeStore.save({
            ...world.tribe,
            chiefId: world.members[4].id,
        })
        const allTasks = await world.getAllTasks(newMember.id)
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
    const questFinale = new QuestFinale(context)

    const getApproval = async () => {
        await tribeApplication.appyToTribe({
            coverLetter: 'I want to FOO!',
            tribeId: tribe.id,
            userId: user.id,
        })
        const initQuest = (await context.stores.questStore._last())!
        const chiefUser = users[0]
        const shamanUser = users[1]
        const initReq = {
            questId: initQuest.id,
            elderUserId: chiefUser.id,
            place: 'The Foo Bar',
            time: 1_700_100_500_000,
        }
        await initiation.startInitiation(initReq)
        await initiation.approveByChief(initReq)
        const newInitQuest = (await context.stores.questStore._last())!
        const shamanReq = {
            ...initReq,
            elderUserId: shamanUser.id,
            questId: newInitQuest.id,
        }
        await initiation.startShamanInitiation(shamanReq)
        await initiation.approveByShaman(shamanReq)
        return (await context.stores.memberStore.find({ userId: user.id }))[0]
    }

    const getNewItroTask = async () => {
        const tasks = await context.stores.taskStore.find({
            type: 'intorduction-quest',
            done: false,
        })
        return tasks.length ? (tasks[0] as IntroductionTask & Storable) : null
    }
    const getOldMember = (task: IntroductionTask | null) => {
        return task
            ? members.find((m) => m.id === task.payload.oldMemberId)
            : undefined
    }
    const makeIntroTask = async (newMemberId: string) => {
        let task = (await getNewItroTask())!
        const next = async () => {
            await introQuests.notifyOldMember(task)
            const quest = await context.stores.questStore._last()
            for (let id of quest!.memberIds) {
                console.log(`finalyse for ${id}, quest: ${quest!.id}`)

                await questFinale.finalyze({
                    memberId: id,
                    questId: quest!.id,
                    votes: [],
                })
            }
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

    const getAllTasks = async (newMemberId: string) => {
        let { task, next } = await makeIntroTask(newMemberId)
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
        questFinale,
        app: tribeApplication,
        getApproval,
        makeIntroTask,
        getAllTasks,
        spyOnMessage: context.testing.spyOnMessage,
    }
}
