import { StoreUser } from '../use-cases/utils/context-user'

export class ApplicationViewModel extends StoreUser {
    async getApplicationInfo(questId: string) {
        const quest = await this.getInitiationQuest(questId)
        const app = await this.getApplication(quest.applicationId)
        const applicant = await this.getMember(app.memberId)
        const applicantUser = await this.getUser(applicant.userId)
        const tribe = await this.getTribe(app.tribeId)
        return {
            applicantName: applicantUser.name,
            tribe: tribe.name,
            coverLetter: app.coverLetter,
        }
    }
}
