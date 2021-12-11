import { QuestType } from '../entities/quest'
import { Tribalizm } from '../tribalism'
import { ILogger } from './logger'
import {
    Scheduler,
    isHowWasQuestTask,
    isIntroductionTask,
    isStormNotify,
    isStormStart,
    isStormToVoting,
    isStormFinalize,
    isHowWasGatheringTask,
} from './scheduler'

export class TaskDispatcher {
    private tribalism: Tribalizm
    private scheduler: Scheduler
    private logger: ILogger
    constructor(tribalism: Tribalizm, scheduler: Scheduler, logger: ILogger) {
        this.logger = logger
        this.tribalism = tribalism
        this.scheduler = scheduler
    }

    run = async () => {
        const tasks = await this.scheduler.getTasks()
        this.logger.trace('Dispatch tasks', { tasks: tasks.map((t) => t.type) })
        for (let task of tasks) {
            if (isHowWasQuestTask(task)) {
                if (task.payload.questType === QuestType.initiation) {
                    await this.tribalism.initiation.howWasIt(task)
                } else {
                    await this.tribalism.questFinale.howWasIt(task)
                }
            }
            if (isHowWasGatheringTask(task)) {
                await this.tribalism.gatheringFinale.notifyMembers(task)
            }
            if (isIntroductionTask(task)) {
                await this.tribalism.introductionQuests.notifyOldMember(task)
            }
            if (isStormNotify(task)) {
                await this.tribalism.brainstormLifecycle.notifyMembers(task)
            }
            if (isStormStart(task)) {
                await this.tribalism.brainstormLifecycle.startStorm(task)
            }
            if (isStormToVoting(task)) {
                await this.tribalism.brainstormLifecycle.toVoting(task)
            }
            if (isStormFinalize(task)) {
                await this.tribalism.brainstormLifecycle.finalyze(task)
                await this.tribalism.ideasIncarnation.incarnateIdeas(task)
            }
        }
        return tasks.length
    }
}
