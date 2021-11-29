import { Storable, Store } from './store'

export interface GatheringStore extends Store<IGathering> {}

export type GatheringType = 'upvoters' | 'all'
export interface IGatheringData {
    id: string | null
    tribeId: string
    parentQuestId: string
    description: string
    time: number
    place: string
    type: GatheringType
    accepted: string[]
    declined: string[]
    done: string[]
}
export interface IGathering extends IGatheringData {
    accept: (memberId: string) => void
    decline: (memberId: string) => void
    imDone: (memberId: string) => void
}
type NeededParams = Pick<
    IGatheringData,
    'description' | 'place' | 'time' | 'type' | 'tribeId' | 'parentQuestId'
>

export class Gathering implements IGathering {
    id: string | null
    tribeId: string
    parentQuestId: string
    description: string
    time: number
    place: string
    type: GatheringType
    accepted: string[]
    declined: string[]
    done: string[]
    constructor(params: NeededParams & Partial<IGatheringData & Storable>) {
        this.id = params.id || null
        this.description = params.description
        this.tribeId = params.tribeId
        this.parentQuestId = params.parentQuestId
        this.time = params.time
        this.place = params.place
        this.type = params.type
        this.accepted = params.accepted || []
        this.declined = params.declined || []
        this.done = params.done || []
    }

    accept = (memberId: string) => {
        this.declined = this.declined.filter((id) => id !== memberId)
        this.accepted.push(memberId)
    }
    decline = (memberId: string) => {
        this.accepted = this.accepted.filter((id) => id !== memberId)
        this.declined.push(memberId)
    }
    imDone = (memberId: string) => {
        if (!this.accepted.includes(memberId)) {
            throw new NotParticipated(
                `Member ${memberId} was not participaded in "${this.description}"`
            )
        }
        this.done.push(memberId)
    }
}

export class NotParticipated extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
