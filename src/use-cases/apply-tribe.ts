import { Application } from './entities/application'
import { Member } from './entities/member'
import { ContextUser } from './utils/context-user'
import { Message } from './utils/message'

export class TribeApplication extends ContextUser {
    appyToTribe = async (
        userId: string,
        tribeId: string,
        coverLetter: string
    ) => {
        const user = await this.getUser(userId)
        const tribe = await this.getTribe(tribeId)
        if (!tribe.chiefId) {
            throw new NoChiefTribeError(`Tribe ${tribeId} has no chief`)
        }
        const chief = await this.getMember(tribe.chiefId)
        const newMember = await this.stores.memberStore.save(
            new Member({ userId: user.id, tribeId: tribe.id })
        )
        const app = await this.stores.applicationStore.save(
            new Application({
                memberId: newMember.id,
                tribeId,
                coverLetter,
                chiefId: tribe.chiefId,
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
