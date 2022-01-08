import { Application } from './entities/application'
import { Member, SavedMember } from './entities/member'
import { InitiationQuest } from './entities/quest'
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
        const elders = await this.getRandomMembers(req.tribeId)

        const currentElder = elders[0]
        // creates a new _candidate_ member of the tribe
        const newMember = await this.stores.memberStore.save(
            new Member({ userId: user.id, tribeId: tribe.id })
        )
        const app = await this.stores.applicationStore.save(
            new Application({
                memberId: newMember.id,
                tribeId: req.tribeId,
                coverLetter: req.coverLetter,
                elderIds: elders.map((e) => e.id),
                currentElderId: currentElder.id,
            })
        )

        const quest = await this.stores.questStore.save(
            new InitiationQuest({
                memberIds: [currentElder.id, app.memberId],
                applicationId: app.id,
            })
        )

        this.notify<ApplicationMessage>({
            type: 'application-message',
            payload: {
                targetUserId: currentElder.userId,
                questId: quest.id,
            },
        })
    }
    private async getRandomMembers(tribeId: string) {
        const maxMembers = 3
        const allTribeMembers = await this.stores.memberStore.findSimple({
            tribeId,
        })
        const neededMembers = Math.min(maxMembers, allTribeMembers.length)
        const members = new Set<SavedMember>()
        while (members.size < neededMembers) {
            members.add(
                allTribeMembers[
                    Math.floor(Math.random() * allTribeMembers.length)
                ]
            )
        }
        return Array.from(members)
    }
}

// TODO move to some common place
export interface ApplicationMessage extends Message {
    type: 'application-message'
    payload: {
        targetUserId: string
        questId: string
    }
}
