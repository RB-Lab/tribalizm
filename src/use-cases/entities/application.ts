export interface ApplicationStore {
    save: (application: IApplication) => Promise<SavedApplication>
    getById: (id: string) => Promise<SavedApplication | null>
}

export interface IApplication {
    id: string | null
    tribeId: string
    memberId: string
    coverLetter: string
    elderId: string | null
    phase: ApplicationPhase
    nextPhase: () => void
}
export interface SavedApplication extends IApplication {
    id: string
}

export enum ApplicationPhase {
    initial = 'initial',
    chiefInitiation = 'chiefInitiation',
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
    private _elderId: string | null = null
    get elderId() {
        return this._elderId
    }
    set elderId(newId: string | null) {
        this._elderId = newId
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
        elderId?: string
        phase?: ApplicationPhase
    }) {
        this._id = params.id || null
        this._tribeId = params.tribeId
        this._memberId = params.memberId
        this._coverLetter = params.coverLetter
        this._elderId = params.elderId || null
        this._phase = params.phase || ApplicationPhase.initial
    }

    nextPhase = () => {
        switch (this.phase) {
            case ApplicationPhase.initial:
                this._phase = ApplicationPhase.chiefInitiation
                break
            case ApplicationPhase.chiefInitiation:
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
