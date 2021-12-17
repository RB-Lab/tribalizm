import { Brainstorm } from './entities/brainstorm'
import {
    StormFinalize,
    StormNotify,
    StormStart,
    StormToVoting,
} from './utils/scheduler'
import { ContextUser } from './utils/context-user'
import { Message } from './utils/message'
import { Storable } from './entities/store'

/**
 * Moves @see Brainstorm through it's phases (new, started, voting, done) directly or via task
 * allocations and notifis members about those transitions
 */
export class BrainstormLifecycle extends ContextUser {
    declare = async (req: BrainstormDeclarationContext) => {
        const member = await this.getMember(req.memberId)
        const tribe = await this.getTribe(member.tribeId)
        if (member.id !== tribe.chiefId) {
            throw new NotAChiefError(
                `You are not a chief of the tribe ${tribe.name}`
            )
        }

        const storm = await this.stores.brainstormStore.save(
            new Brainstorm({
                tribeId: member.tribeId,
                time: req.time,
            })
        )

        const members = await this.stores.memberStore.findSimple({
            tribeId: member.tribeId,
        })

        await this.scheduler.schedule<StormNotify>({
            type: 'notify-brainstorm',
            done: false,
            time: storm.time - 6 * 3_600_000,
            payload: { brainstormId: storm.id },
        })
        await this.scheduler.schedule<StormNotify>({
            type: 'notify-brainstorm',
            done: false,
            time: storm.time - 5 * 60_000,
            payload: { brainstormId: storm.id },
        })
        await this.scheduler.schedule<StormStart>({
            type: 'start-brainstorm',
            done: false,
            time: storm.time,
            payload: { brainstormId: storm.id },
        })

        members.forEach((m) => {
            if (m.id === member.id) return
            if (m.isCandidate) return
            this.notify<BrainstormDeclarationMessage>({
                type: 'new-brainstorm',
                payload: {
                    targetMemberId: m.id,
                    targetUserId: m.userId,
                    brainstormId: storm.id,
                    time: storm.time,
                },
            })
        })
    }

    notifyMembers = async (task: StormNotify & Storable) => {
        const storm = await this.getBrainstorm(task.payload.brainstormId)
        const tribe = await this.getTribe(storm.tribeId)
        const members = await this.stores.memberStore.findSimple({
            tribeId: tribe.id,
        })
        members.forEach((m) => {
            if (m.isCandidate) return
            this.notify<BrainstormNoticeMessage>({
                type: 'brainstorm-notice',
                payload: {
                    targetUserId: m.userId,
                    targetMemberId: m.id,
                    brainstormId: storm.id,
                    time: storm.time,
                },
            })
        })
        await this.scheduler.markDone(task.id)
    }

    startStorm = async (task: StormStart & Storable) => {
        const storm = await this.getBrainstorm(task.payload.brainstormId)
        const tribe = await this.getTribe(storm.tribeId)
        const members = await this.stores.memberStore.findSimple({
            tribeId: tribe.id,
        })

        members.forEach((m) => {
            if (m.isCandidate) return
            this.notify<BrainstormStartedMessage>({
                type: 'brainstorm-started',
                payload: {
                    brainstormId: storm.id,
                    targetMemberId: m.id,
                    targetUserId: m.userId,
                },
            })
        })

        this.scheduler.schedule<StormToVoting>({
            type: 'brainstorm-to-voting',
            done: false,
            time: storm.time + 10 * 60_000,
            payload: { brainstormId: storm.id },
        })
        storm.start()
        await this.stores.brainstormStore.save(storm)
        await this.scheduler.markDone(task.id)
    }

    toVoting = async (task: StormToVoting & Storable) => {
        const storm = await this.getBrainstorm(task.payload.brainstormId)
        const tribe = await this.getTribe(storm.tribeId)

        const members = await this.stores.memberStore.findSimple({
            tribeId: tribe.id,
        })

        members.forEach((m) => {
            if (m.isCandidate) return
            this.notify<VotingStartedMessage>({
                type: 'voting-started',
                payload: {
                    targetUserId: m.userId,
                    brainstormId: storm.id,
                    targetMemberId: m.id,
                },
            })
        })
        this.scheduler.schedule<StormFinalize>({
            type: 'brainstorm-to-finalize',
            done: false,
            time: Date.now() + 5 * 60_000,
            payload: { brainstormId: storm.id },
        })
        storm.toVoting()
        await this.stores.brainstormStore.save(storm)
        await this.scheduler.markDone(task.id)
    }
    finalize = async (task: StormFinalize) => {
        const brainstorm = await this.getBrainstorm(task.payload.brainstormId)
        brainstorm.finish()
        await this.stores.brainstormStore.save(brainstorm)
        const members = await this.stores.memberStore.findSimple({
            tribeId: brainstorm.tribeId,
        })
        members.forEach((member) => {
            if (member.isCandidate) return
            this.notify<StormEndedMessage>({
                type: 'brainstorm-ended',
                payload: {
                    brainstormId: brainstorm.id,
                    targetMemberId: member.id,
                    targetUserId: member.userId,
                },
            })
        })
    }
}

interface BrainstormDeclarationContext {
    memberId: string
    time: number
}

export interface BrainstormDeclarationMessage extends Message {
    type: 'new-brainstorm'
    payload: {
        brainstormId: string
        targetMemberId: string
        targetUserId: string
        time: number
    }
}
export interface BrainstormNoticeMessage extends Message {
    type: 'brainstorm-notice'
    payload: {
        brainstormId: string
        targetMemberId: string
        targetUserId: string
        time: number
    }
}
export interface BrainstormStartedMessage extends Message {
    type: 'brainstorm-started'
    payload: {
        brainstormId: string
        targetMemberId: string
        targetUserId: string
    }
}

export interface VotingStartedMessage extends Message {
    type: 'voting-started'
    payload: {
        brainstormId: string
        targetMemberId: string
        targetUserId: string
    }
}

export interface StormEndedMessage extends Message {
    type: 'brainstorm-ended'
    payload: {
        brainstormId: string
        targetMemberId: string
        targetUserId: string
    }
}

export class NotAChiefError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
