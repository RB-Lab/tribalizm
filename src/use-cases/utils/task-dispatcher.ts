import { QuestType } from '../entities/quest'
import { Tribalizm } from '../tribalism'
import { Scheduler, isHowWasQuestTask } from './scheduler'

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
                    this.tribalism.initiation.howWasIt({
                        questId: task.payload.questId,
                    })
                }
            }
        }
    }
}
