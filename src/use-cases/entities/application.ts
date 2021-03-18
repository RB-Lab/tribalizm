import { Storable, Store } from './store'

export interface ApplicationStore extends Store<IApplication> {}

type ApplicationStatus = 'approved' | 'decilned'

export interface IApplicationData {
    id: string | null
    tribeId: string
    memberId: string
    coverLetter: string
    chiefId: string | null
    shamanId: string | null
    phase: ApplicationPhase
    status?: ApplicationStatus
}
export interface IApplication extends IApplicationData {
    nextPhase: () => void
    approve: () => void
    decline: () => void
}

export enum ApplicationPhase {
    initial = 'initial',
    chiefInitiation = 'chiefInitiation',
    awaitingShaman = 'awaitingShaman',
    shamanInitiation = 'shamanInitiation',
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
    chiefId: string | null
    shamanId: string | null
    phase: ApplicationPhase
    status?: ApplicationStatus

    constructor(params: RequiredParams & Partial<IApplicationData & Storable>) {
        this.id = params.id || null
        this.tribeId = params.tribeId
        this.memberId = params.memberId
        this.coverLetter = params.coverLetter
        this.chiefId = params.chiefId || null
        this.shamanId = params.shamanId || null
        this.phase = params.phase || ApplicationPhase.initial
        this.status = params.status
    }
    approve = () => {
        this.phase = ApplicationPhase.finished
        this.status = 'approved'
    }
    decline = () => {
        this.phase = ApplicationPhase.finished
        this.status = 'decilned'
    }

    nextPhase = () => {
        switch (this.phase) {
            case ApplicationPhase.initial:
                this.phase = ApplicationPhase.chiefInitiation
                break
            case ApplicationPhase.chiefInitiation:
                this.phase = ApplicationPhase.awaitingShaman
                break
            case ApplicationPhase.awaitingShaman:
                this.phase = ApplicationPhase.shamanInitiation
                break
            case ApplicationPhase.shamanInitiation:
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
