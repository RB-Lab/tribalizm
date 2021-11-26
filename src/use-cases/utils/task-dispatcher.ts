import { QuestType } from '../entities/quest'
import { Tribalizm } from '../tribalism'
import {
    Scheduler,
    isHowWasQuestTask,
    isIntroductionTask,
    isStormNotify,
    isStormStart,
    isStormToVoting,
    isStormFinalyze,
} from './scheduler'

export class TaskDiscpatcher {
    private tribalism: Tribalizm
    private scheduler: Scheduler
    constructor(tribalism: Tribalizm, scheduler: Scheduler) {
        this.tribalism = tribalism
        this.scheduler = scheduler
    }

    run = async () => {
        const tasks = await this.scheduler.getTasks()
        for (let task of tasks) {
            if (isHowWasQuestTask(task)) {
                if (task.payload.questType === QuestType.initiation) {
                    this.tribalism.initiation.howWasIt(task)
                } else {
                    this.tribalism.questFinale.howWasIt(task)
                }
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
            if (isStormFinalyze(task)) {
                this.tribalism.brainstormLifecycle.finalyze(task)
                this.tribalism.ideasIncarnation.incarnateIdeas(task)
            }
        }
    }
}
