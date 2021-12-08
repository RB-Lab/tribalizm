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
                    this.tribalism.initiation.howWasIt(task)
                } else {
                    this.tribalism.questFinale.howWasIt(task)
                }
            }
            if (isHowWasGatheringTask(task)) {
                this.tribalism.gatheringFinale.notifyMembers(task)
            }
            if (isIntroductionTask(task)) {
                this.tribalism.introductionQuests.notifyOldMember(task)
            }
            if (isStormNotify(task)) {
                this.tribalism.brainstormLifecycle.notifyMembers(task)
            }
            if (isStormStart(task)) {
                this.tribalism.brainstormLifecycle.startStorm(task)
            }
            if (isStormToVoting(task)) {
                this.tribalism.brainstormLifecycle.toVoting(task)
            }
            if (isStormFinalize(task)) {
                this.tribalism.brainstormLifecycle.finalyze(task)
                this.tribalism.ideasIncarnation.incarnateIdeas(task)
            }
        }
    }
}
