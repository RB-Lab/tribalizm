export interface MemberStore {
    find: (params: { tribeId: string }) => Promise<Member[]>
    getById: (id: string) => Promise<Member | null>
}
export class Member {
    private _id: string
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
    constructor(
        id: string,
        userId: string,
        tribeId: string,
        charisma: number = 0,
        wisdom: number = 0
    ) {
        this._id = id
        this._userId = userId
        this._tribeId = tribeId
        this._charisma = charisma
        this._wisdom = wisdom
    }
}
