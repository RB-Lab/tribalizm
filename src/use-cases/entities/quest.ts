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
    acceptedIds: string[]
    finishedIds: string[]
    votedMembers: VotedMembers
    accept: (memberId: string) => string[]
    /** @returns members to notify */
    propose: (time: number, place: string, memberId: string) => string[]
    decline: (memberId: string) => void
    /** @returns members to notify */
    finish: (memberId: string) => void
    getNextVoteAction: (memberId: string) => VoteAction | null
    castCharisma: (
        memberId: string,
        voteForId: string,
        charisma: number
    ) => void
    castWisdom: (memberId: string, voteForId: string, charisma: number) => void
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
    public acceptedIds: string[]
    public finishedIds: string[]
    public votedMembers: VotedMembers

    constructor(params: Partial<SavedQuest> = {}) {
        this.id = params.id || null
        this.ideaId = params.ideaId || null
        this.type = params.type || QuestType.coordination
        this.status = params.status || QuestStatus.proposed
        this.description = params.description || ''
        this.time = params.time || Date.now()
        this.place = params.place || ''
        this.memberIds = params.memberIds || []
        this.acceptedIds = params.acceptedIds || []
        this.finishedIds = params.finishedIds || []
        this.votedMembers = params.votedMembers || {}
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
        this.acceptedIds = [memberId]
        return this.memberIds.filter((id) => id !== memberId)
    }

    accept = (memberId: string) => {
        this.checkAssigned(memberId)
        if (this.time < Date.now()) {
            throw new InvalidAcceptanceTime(
                'This quet is outdated. Please propose a new time'
            )
        }
        this.acceptedIds.push(memberId)
        if (this.acceptedIds.length === this.memberIds.length) {
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
        this.acceptedIds = this.acceptedIds.filter((id) => id !== memberId)
    }

    finish = (memberId: string) => {
        this.checkAssigned(memberId)
        this.finishedIds.push(memberId)
    }
    getNextVoteAction = (memberId: string) => {
        this.checkAssigned(memberId)
        const actions: Votable[] = ['charisma', 'wisdom']
        const voted = this.votedMembers[memberId] || {}
        for (let id of this.memberIds) {
            if (id !== memberId) {
                const votes = voted[id] || {}
                for (let action of actions) {
                    if (votes[action] === undefined) {
                        return { action, memberId: id }
                    }
                }
            }
        }
        return null
    }
    castCharisma = (memberId: string, voteForId: string, charisma: number) => {
        this.castTrait(memberId, voteForId, { charisma })
    }
    castWisdom = (memberId: string, voteForId: string, wisdom: number) => {
        this.castTrait(memberId, voteForId, { wisdom })
    }

    private castTrait = (
        memberId: string,
        voteForId: string,
        trait: { wisdom: number } | { charisma: number }
    ) => {
        this.checkAssigned(memberId)
        if (memberId === voteForId) {
            throw new SelfVotingError('Voting for yourself is not allowed')
        }
        const traitVote = 'wisdom' in trait ? trait.wisdom : trait.charisma

        if (traitVote > 9 || traitVote < 0) {
            const traitName = Object.keys(trait)[0]
            throw new VoteRangeError(
                `${
                    traitName[0].toUpperCase + traitName.slice(1)
                } vote must be between 0 and 9 but ${traitVote} given`
            )
        }
        const voted = this.votedMembers[memberId] || {}
        this.votedMembers = {
            ...this.votedMembers,
            [memberId]: {
                ...voted,
                [voteForId]: {
                    ...voted[voteForId],
                    ...trait,
                },
            },
        }
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

export class SelfVotingError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
export class VoteRangeError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export class IndeclinableError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
type Votable = 'charisma' | 'wisdom'

interface VoteAction {
    action: Votable
    memberId: string
}

type VotedMembers = Record<string, Record<string, Record<Votable, number>>>

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
