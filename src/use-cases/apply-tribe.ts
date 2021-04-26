import { Application } from './entities/application'
import { Member } from './entities/member'
import { ContextUser } from './utils/context-user'
import { Message } from './utils/message'

interface ApplicationRequest {
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
        this.notify<ApplicationMessage>({
            type: 'application-message',
            payload: {
                elderId: chief.id,
                applicationId: app.id,
                coverLetter: app.coverLetter,
                userName: user.name,
            },
        })
        return app
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
        elderId: string
        applicationId: string
        userName: string
        coverLetter: string
    }
}
