import { Application } from './entities/application'
import { Member } from './entities/member'
import { InitiationQuest, QuestType } from './entities/quest'
import { ContextUser } from './utils/context-user'
import { Message } from './utils/message'

export interface ApplicationRequest {
    userId: string
    tribeId: string
    coverLetter: string
}

export class TribeApplication extends ContextUser {
    applyToTribe = async (req: ApplicationRequest) => {
        const user = await this.getUser(req.userId)
        const tribe = await this.getTribe(req.tribeId)
        const member = await this.getMember('TODO')
        // creates a new _candidate_ member of the tribe
        const newMember = await this.stores.memberStore.save(
            new Member({ userId: user.id, tribeId: tribe.id })
        )
        const app = await this.stores.applicationStore.save(
            new Application({
                memberId: newMember.id,
                tribeId: req.tribeId,
                coverLetter: req.coverLetter,
            })
        )

        const quest = await this.stores.questStore.save(
            new InitiationQuest({
                type: QuestType.initiation,
                memberIds: [member.id, app.memberId],
                applicationId: app.id,
            })
        )
        this.notify<ApplicationMessage>({
            type: 'application-message',
            payload: {
                targetUserId: member.userId,
                tribeName: tribe.name,
                questId: quest.id,
                coverLetter: app.coverLetter,
                userName: user.name,
            },
        })
    }
}

export class NoChiefTribeError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export interface ApplicationMessage extends Message {
    type: 'application-message'
    payload: {
        targetUserId: string
        tribeName: string
        questId: string
        userName: string
        coverLetter: string
    }
}
