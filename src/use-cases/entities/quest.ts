export interface QuestStore {
    save: (quest: IQuest) => Promise<SavedQuest>
    saveBulk: (quest: IQuest[]) => Promise<SavedQuest[]>
    getActiveQuestsCount: (
        memberIds: string[]
    ) => Promise<{ [id: string]: number }>
    find: (query: {
        ideaId?: (string | null) | Array<string | null>
    }) => Promise<SavedQuest[]>
}
export interface IQuest {
    id: string | null
    ideaId: string | null
    type: QuestType
    status: QuestStatus
    description: string
    time: number // timestamp
    place: string
    memberIds: string[]
}
export interface SavedQuest extends IQuest {
    id: string
}

export class Quest implements IQuest {
    public id: string | null
    public ideaId: string | null
    public type: QuestType
    public status: QuestStatus
    public description: string
    public time: number
    public place: string
    public memberIds: string[]

    constructor(params: Partial<SavedQuest> = {}) {
        this.id = params.id || null
        this.ideaId = params.ideaId || null
        this.type = params.type || QuestType.coordination
        this.status = params.status || QuestStatus.proposed
        this.description = params.description || ''
        this.time = params.time || Date.now()
        this.place = params.place || ''
        this.memberIds = params.memberIds || []
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
