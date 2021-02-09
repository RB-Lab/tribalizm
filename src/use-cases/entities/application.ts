export interface ApplicationStore {
    save: (application: IApplication) => Promise<SavedApplication>
    getById: (id: string) => Promise<SavedApplication | null>
}

type ApplicationStatus = 'approved' | 'decilned'

export interface IApplication {
    id: string | null
    tribeId: string
    memberId: string
    coverLetter: string
    chiefId: string | null
    shamanId: string | null
    phase: ApplicationPhase
    status?: ApplicationStatus
    nextPhase: () => void
    approve: () => void
    decline: () => void
}
export interface SavedApplication extends IApplication {
    id: string
}

export enum ApplicationPhase {
    initial = 'initial',
    chiefInitiation = 'chiefInitiation',
    awaitingShaman = 'awaitingShaman',
    shamanInitiation = 'shamanInitiation',
    finished = 'finished',
}
export class Application implements IApplication {
    private _id: string | null
    get id() {
        return this._id
    }
    private _tribeId: string
    get tribeId() {
        return this._tribeId
    }
    private _memberId: string
    get memberId() {
        return this._memberId
    }
    private _coverLetter: string
    get coverLetter() {
        return this._coverLetter
    }
    private _chiefId: string | null = null
    get chiefId() {
        return this._chiefId
    }
    set chiefId(newId: string | null) {
        this._chiefId = newId
    }
    private _shamanId: string | null = null
    get shamanId() {
        return this._shamanId
    }
    set shamanId(newId: string | null) {
        this._shamanId = newId
    }
    private _status: ApplicationStatus | undefined
    get status() {
        return this._status
    }
    private _phase: ApplicationPhase
    get phase() {
        return this._phase
    }

    constructor(params: {
        id?: string
        tribeId: string
        memberId: string
        coverLetter: string
        chiefId?: string
        shamanId?: string
        phase?: ApplicationPhase
        status?: ApplicationStatus
    }) {
        this._id = params.id || null
        this._tribeId = params.tribeId
        this._memberId = params.memberId
        this._coverLetter = params.coverLetter
        this._chiefId = params.chiefId || null
        this._shamanId = params.shamanId || null
        this._phase = params.phase || ApplicationPhase.initial
        this._status = params.status
    }
    approve = () => {
        this._phase = ApplicationPhase.finished
        this._status = 'approved'
    }
    decline = () => {
        this._phase = ApplicationPhase.finished
        this._status = 'decilned'
    }

    nextPhase = () => {
        switch (this.phase) {
            case ApplicationPhase.initial:
                this._phase = ApplicationPhase.chiefInitiation
                break
            case ApplicationPhase.chiefInitiation:
                this._phase = ApplicationPhase.awaitingShaman
                break
            case ApplicationPhase.awaitingShaman:
                this._phase = ApplicationPhase.shamanInitiation
                break
            case ApplicationPhase.shamanInitiation:
                this._phase = ApplicationPhase.finished
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
