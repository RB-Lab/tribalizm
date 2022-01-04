import { Storable, Store } from '../utils/store'

export interface QuestStore extends Store<IQuest> {
    /**
     * Counts all quests that currently assigned to a member
     * @param memberIds ids of those member for whom to search quests
     * @returns map of member ids to number of quests assigned to them
     */
    getActiveQuestsCount: (
        memberIds: string[]
    ) => Promise<{ [id: string]: number }>
    // TODO: add pagination
    /**
     * get all introduction quests for a particular tribe member (so you can decide whti whom they
     * didn't met yet)
     */
    getAllIntroQuests: (memberId: string) => Promise<Array<IQuest & Storable>>
}
export enum QuestType {
    coordination = 'coordination',
    initiation = 'initiation',
    introduction = 'introduction',
}

export enum QuestStatus {
    proposed = 'proposed',
    accepted = 'accepted',
    declined = 'declined',
    done = 'done',
}

export interface IQuestData {
    // TODO add tribeId here & get rid of getQuestMemberByUserId & parentQuestMember
    id: string | null
    type: QuestType
    status: QuestStatus
    /** timestamp when quest to take place */
    time: number | null
    place: string | null
    memberIds: string[]
    acceptedIds: string[]
}

export interface IQuest extends IQuestData {
    /** @returns members to notify */
    accept: (memberId: string) => string[]
    /** @returns members to notify */
    propose: (time: number, place: string, memberId: string) => string[]
    decline: (memberId: string) => void
    addAssignee: (memberId: string) => void
}
export type SavedQuest = IQuestData & Storable

export class Quest implements IQuest {
    public id: string | null
    public type: QuestType
    public status: QuestStatus
    public time: number | null
    public place: string | null
    public memberIds: string[]
    public acceptedIds: string[]

    constructor(params: Partial<SavedQuest> = {}) {
        this.id = params.id || null
        this.type = params.type || QuestType.coordination
        this.status = params.status || QuestStatus.proposed
        this.time = params.time || null
        this.place = params.place || null
        this.memberIds = params.memberIds || []
        this.acceptedIds = params.acceptedIds || []
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
        if (this.time && this.time < Date.now()) {
            throw new InvalidAcceptanceTime(
                `Cannot accept quest ${this.id}: it is outdated, ${
                    this.time
                }, now: ${Date.now()}`
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
    addAssignee = (memberId: string) => {
        this.memberIds = [...this.memberIds, memberId]
    }

    private checkAssigned(memberId: string) {
        if (!this.memberIds.includes(memberId)) {
            throw new NotYourQuest(
                `Cannot change the quest ${this.id}, user ${memberId} is not assignet to this quest`
            )
        }
    }
}

export type InitiationQuestParams = Partial<SavedQuest> & {
    applicationId: string
}
export class InitiationQuest extends Quest {
    applicationId: string
    type = QuestType.initiation
    constructor(params: InitiationQuestParams) {
        super(params)
        this.applicationId = params.applicationId
    }
}

export function isInitiationQuest(quest: IQuest): quest is InitiationQuest {
    return quest.type === QuestType.initiation
}

export type IntroductionQuestParams = Partial<SavedQuest> & {
    newMemberId: string
}
export class IntroductionQuest extends Quest {
    newMemberId: string
    type = QuestType.introduction
    constructor(params: IntroductionQuestParams) {
        super(params)
        this.newMemberId = params.newMemberId
    }
}

export function isIntroductionQuest(quest: IQuest): quest is IntroductionQuest {
    return quest.type === QuestType.introduction
}

export type CoordinationQuestParams = Partial<SavedQuest> & {
    description: string
    ideaId: string | null
    parentQuestId: string | null
}
export class CoordinationQuest extends Quest {
    description: string
    ideaId: string | null
    parentQuestId: string | null
    type = QuestType.coordination
    constructor(params: CoordinationQuestParams) {
        super(params)
        this.description = params.description
        this.ideaId = params.ideaId
        this.parentQuestId = params.parentQuestId
    }
}
export function isCoordinationQuest(quest: IQuest): quest is CoordinationQuest {
    return quest.type === QuestType.coordination
}

export const questTypesMap = {
    [QuestType.initiation]: InitiationQuest,
    [QuestType.introduction]: IntroductionQuest,
    [QuestType.coordination]: CoordinationQuest,
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

export class QuestIncompleteError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
