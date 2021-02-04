export interface MemberStore {
    find: (params: {
        tribeId?: string | string[]
        id?: string | string[]
        userId?: string | string[]
    }) => Promise<SavedMember[]>
    getById: (id: string) => Promise<SavedMember | null>
    save: (member: IMember) => Promise<SavedMember>
    saveBulk: (member: IMember[]) => Promise<SavedMember[]>
}

export interface IMember {
    id: string | null
    userId: string
    tribeId: string
    charisma: number
    wisdom: number
    isCandidate: boolean
}
export interface SavedMember extends IMember {
    id: string
}

export class Member implements IMember {
    private _id: string | null
    get id() {
        return this._id
    }
    private _userId: string
    get userId() {
        return this._userId
    }
    private _tribeId: string
    get tribeId() {
        return this._tribeId
    }
    private _charisma: number
    get charisma() {
        return this._charisma
    }
    private _wisdom: number
    get wisdom() {
        return this._wisdom
    }
    private _isCandidate: boolean
    get isCandidate() {
        return this._isCandidate
    }
    constructor(params: {
        id?: string
        userId: string
        tribeId: string
        charisma?: number
        wisdom?: number
        isCandidate?: boolean
    }) {
        this._id = params.id || null
        this._userId = params.userId
        this._tribeId = params.tribeId
        this._charisma = params.charisma || 0
        this._wisdom = params.wisdom || 0
        this._isCandidate = params.isCandidate || true
    }
}
