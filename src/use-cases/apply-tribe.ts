import { Application } from './entities/application'
import { Member } from './entities/member'
import { Quest, QuestType } from './entities/quest'
import { ContextUser } from './utils/context-user'
import { Message } from './utils/message'

export interface ApplicationRequest {
    userId: string
    tribeId: string
    coverLetter: string
}

export class TribeApplication extends ContextUser {
    appyToTribe = async (req: ApplicationRequest) => {
        const user = await this.getUser(req.userId)
        const tribe = await this.getTribe(req.tribeId)
        if (!tribe.chiefId) {
            throw new NoChiefTribeError(`Tribe ${req.tribeId} has no chief`)
        }
        const chief = await this.getMember(tribe.chiefId)
        // creates a new _candidate_ member of the tribe
        const newMember = await this.stores.memberStore.save(
            new Member({ userId: user.id, tribeId: tribe.id })
        )
        const app = await this.stores.applicationStore.save(
            new Application({
                memberId: newMember.id,
                tribeId: req.tribeId,
                coverLetter: req.coverLetter,
                chiefId: tribe.chiefId,
                shamanId: tribe.shamanId,
            })
        )

        const quest = await this.stores.questStore.save(
            new Quest({
                type: QuestType.initiation,
                memberIds: [tribe.chiefId, app.memberId],
                applicationId: app.id,
            })
        )
        this.notify<ApplicationMessage>({
            type: 'application-message',
            payload: {
                targetUserId: chief.userId,
                targetMemberId: chief.id,
                tribeName: tribe.name,
                qeuestId: quest.id,
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
        targetMemberId: string
        tribeName: string
        qeuestId: string
        userName: string
        coverLetter: string
    }
}
