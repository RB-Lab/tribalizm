// TODO exctract a common sotre interface
export interface QuestStore {
    save: (quest: IQuest) => Promise<SavedQuest>
    saveBulk: (quest: IQuest[]) => Promise<SavedQuest[]>
    getById: (id: string) => Promise<SavedQuest | null>
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
    accepted: string[]
    /** @returns members to notify */
    accept: (memberId: string) => string[]
    /** @returns members to notify */
    propose: (time: number, place: string, memberId: string) => string[]
    decline: (memberId: string) => void
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
    public accepted: string[]

    constructor(params: Partial<SavedQuest> = {}) {
        this.id = params.id || null
        this.ideaId = params.ideaId || null
        this.type = params.type || QuestType.coordination
        this.status = params.status || QuestStatus.proposed
        this.description = params.description || ''
        this.time = params.time || Date.now()
        this.place = params.place || ''
        this.memberIds = params.memberIds || []
        this.accepted = params.accepted || []
    }

    propose = (time: number, place: string, memberId: string) => {
        this.checkAssigned(memberId)
        if (time < Date.now()) {
            throw new InvalidTimeProposal(
                `Cannot propose quest for time ${new Date(
                    time
                ).toISOString()}: it is in the past`
            )
        }
        this.time = time
        this.place = place
        this.status = QuestStatus.proposed
        this.accepted = [memberId]
        return this.memberIds.filter((id) => id !== memberId)
    }

    accept = (memberId: string) => {
        this.checkAssigned(memberId)
        if (this.time < Date.now()) {
            throw new InvalidAcceptanceTime(
                'This quet is outdated. Please propose a new time'
            )
        }
        this.accepted.push(memberId)
        if (this.accepted.length === this.memberIds.length) {
            this.status = QuestStatus.accepted
            return this.memberIds.filter((id) => id !== memberId)
        }

        return []
    }
    decline = (memberId: string) => {
        if (this.type === QuestType.initiation) {
            throw new IndeclinableError('Initiation quest cannot be declined')
        }
        this.checkAssigned(memberId)
        this.memberIds = this.memberIds.filter((id) => id !== memberId)
        this.accepted = this.accepted.filter((id) => id !== memberId)
    }

    private checkAssigned(memberId: string) {
        if (!this.memberIds.includes(memberId)) {
            throw new NotYourQuest(
                `Cannot change the quest ${this.id}, user ${memberId} is not assignet to this quest`
            )
        }
    }
}

export class InvalidTimeProposal extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
export class InvalidAcceptanceTime extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
export class NotYourQuest extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export class IndeclinableError extends Error {
    constructor(msg: string) {
        super(msg)
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
