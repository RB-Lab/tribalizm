export interface QuestsStore {
    save: <T extends Quest | Quest[]>(quest: T) => Promise<T>
}

export class Quest {
    private _id: string | null
    get id() {
        return this._id
    }
    private _type: QuestType
    get type() {
        return this._type
    }
    private _status: QuestStatus
    get status() {
        return this._status
    }
    private _description: string
    get description() {
        return this._description
    }
    private _date: Date
    get date() {
        return this._date
    }
    private _place: string
    get place() {
        return this._place
    }
    private _memberIds: string[]
    get memberIds() {
        return this._memberIds
    }

    constructor(
        params: {
            id?: string
            type?: QuestType
            status?: QuestStatus
            description?: string
            date?: Date
            place?: string
            memberIds?: string[]
        } = {}
    ) {
        this._id = params.id || null
        this._type = params.type || QuestType.coordination
        this._status = params.status || QuestStatus.proposed
        this._description = params.description || ''
        this._date = params.date || new Date()
        this._place = params.place || ''
        this._memberIds = params.memberIds || []
    }
}

export enum QuestType {
    coordination = 'coordination',
    initiation = 'initiation',
    introduction = 'introduction',
    execution = 'execution',
}

export enum QuestStatus {
    proposed = 'proposed',
    accepted = 'accepted',
    declined = 'declined',
    done = 'done',
}
