import { Storable, Store } from '../utils/store'

export interface ApplicationStore extends Store<IApplication> {}

type ApplicationStatus = 'approved' | 'declined'

export interface IApplicationData {
    id: string | null
    tribeId: string
    memberId: string
    coverLetter: string
    phase: ApplicationPhase
    status?: ApplicationStatus
}
// TODO MIGRATE: drop chiefId, shamanId
//               replace chiefInitiation, awaitingShaman, shamanInitiation
export interface IApplication extends IApplicationData {
    nextPhase: () => void
    approve: () => void
    decline: () => void
}

export enum ApplicationPhase {
    initial = 'initial',
    finished = 'finished',
}
export type RequiredParams = Pick<
    IApplicationData,
    'tribeId' | 'memberId' | 'coverLetter'
>

export class Application implements IApplication {
    id: string | null
    tribeId: string
    memberId: string
    coverLetter: string
    phase: ApplicationPhase
    status?: ApplicationStatus

    constructor(params: RequiredParams & Partial<IApplicationData & Storable>) {
        this.id = params.id || null
        this.tribeId = params.tribeId
        this.memberId = params.memberId
        this.coverLetter = params.coverLetter
        this.phase = params.phase || ApplicationPhase.initial
        this.status = params.status
    }
    approve = () => {
        this.phase = ApplicationPhase.finished
        this.status = 'approved'
    }
    decline = () => {
        this.phase = ApplicationPhase.finished
        this.status = 'declined'
    }

    nextPhase = () => {
        switch (this.phase) {
            case ApplicationPhase.initial:
                // TODO what should be here???
                this.phase = ApplicationPhase.finished
                break
            default:
                throw new ApplicationTransitionError(
                    `Cannot change ${this.phase} application phase`
                )
        }
    }
}

export class ApplicationTransitionError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
