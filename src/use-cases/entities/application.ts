import {
    AlreadyApprovedError,
    ApplicationFinishedError,
    NotListedElderError,
    WrongElderError,
} from '../utils/errors'
import { Storable, Store } from '../utils/store'

export interface ApplicationStore extends Store<IApplication> {}

type ApplicationStatus = 'in-progress' | 'approved' | 'declined'

export interface IApplicationData {
    id: string | null
    tribeId: string
    memberId: string
    coverLetter: string
    status: ApplicationStatus
    currentElderId: string
    elderIds: string[]
    approvedIds: string[]
}
// TODO MIGRATE: drop chiefId, shamanId, phase
//               replace status => phase != finished : in-progress
//               add elders: [tribe.chief, tribe.shaman]
//               add currentElder: phase => tribe.chief | tribe.shaman
//               add approvedIds: phase => [?tribe.chief, ?tribe.shaman]
export interface IApplication extends IApplicationData {
    approve: (elderId: string) => void
    decline: (elderId: string) => void
}

export type RequiredParams = Pick<
    IApplicationData,
    'tribeId' | 'memberId' | 'coverLetter' | 'elderIds'
>

export class Application implements IApplication {
    id: string | null
    tribeId: string
    memberId: string
    coverLetter: string
    status: ApplicationStatus
    currentElderId: string
    elderIds: string[]
    approvedIds: string[]

    constructor(params: RequiredParams & Partial<IApplicationData & Storable>) {
        this.id = params.id || null
        this.tribeId = params.tribeId
        this.memberId = params.memberId
        this.coverLetter = params.coverLetter
        this.status = params.status || 'in-progress'
        this.approvedIds = params.approvedIds || []
        this.elderIds = params.elderIds
        this.currentElderId = params.currentElderId ?? this.elderIds[0]
    }
    approve = (elderId: string) => {
        this.check('approve', elderId)
        this.approvedIds.push(elderId)
        if (this.approvedIds.length === this.elderIds.length) {
            this.status = 'approved'
        } else {
            const nextIndex = this.elderIds.indexOf(elderId) + 1
            this.currentElderId = this.elderIds[nextIndex]
        }
    }
    decline = (elderId: string) => {
        this.check('decline', elderId)
        this.status = 'declined'
    }
    private check(action: string, elderId: string) {
        if (this.status !== 'in-progress') {
            throw new ApplicationFinishedError(
                `Cannot ${action} application ${this.id}: it is already ${this.status}.`
            )
        }
        if (this.currentElderId !== elderId) {
            throw new WrongElderError(
                `Cannot ${action} application ${this.id} by member ${elderId}, ` +
                    `currently initiating member is ${this.currentElderId}.`
            )
        }
        if (!this.elderIds.includes(elderId)) {
            throw new NotListedElderError(
                `Cannot ${action} application ${this.id} by member ${elderId}, ` +
                    `who is not listed among ${this.elderIds.join(', ')}.`
            )
        }
        if (this.approvedIds.includes(elderId)) {
            throw new AlreadyApprovedError(
                `Cannot ${action} application ${this.id} by member ${elderId}, ` +
                    `who already approved it.`
            )
        }
    }
}
