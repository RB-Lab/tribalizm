import { Tribalizm } from '../tribalism'
import { ILogger } from './logger'
import {
    isInitiationFeedbackTask,
    isIntroductionTask,
    isStormFinalize,
    isStormNotify,
    isStormStart,
    isStormToVoting,
    Scheduler,
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
            if (isInitiationFeedbackTask(task)) {
                await this.tribalism.initiation.notifyElder(task)
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
                await this.tribalism.brainstormLifecycle.finalize(task)
                await this.tribalism.ideasIncarnation.incarnateIdeas(task)
            }
        }
        return tasks.length
    }
}
