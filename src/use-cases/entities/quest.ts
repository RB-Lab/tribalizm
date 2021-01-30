export interface QuestStore {
    save: (quest: IQuest) => Promise<SavedQuest>
    saveBulk: (quest: IQuest[]) => Promise<SavedQuest[]>
    getActiveQuestsCount: (
        memberIds: string[]
    ) => Promise<{ [id: string]: number }>
}
export interface IQuest {
    id: string | null
    type: QuestType
    status: QuestStatus
    description: string
    date: number // timestamp
    place: string
    memberIds: string[]
}
export interface SavedQuest extends IQuest {
    id: string
}

export class Quest implements IQuest {
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
    private _date: number
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
            date?: number
            place?: string
            memberIds?: string[]
        } = {}
    ) {
        this._id = params.id || null
        this._type = params.type || QuestType.coordination
        this._status = params.status || QuestStatus.proposed
        this._description = params.description || ''
        this._date = params.date || Date.now()
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
