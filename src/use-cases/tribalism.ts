import { AddIdea } from './add-idea'
import { TribeApplication } from './apply-tribe'
import { BrainstormLifecycle } from './brainstorm-lifecycle'
import { GateringAcknowledge } from './gathering-acknowledge'
import { GatheringDeclare } from './gathering-declare'
import { GatheringFinale } from './gathering-finale'
import { IdeasIncarnation } from './incarnate-ideas'
import { Initiation } from './initiation'
import { IntroductionQuests } from './introduction-quests'
import { QuestNegotiation } from './negotiate-quest'
import { QuestFinale } from './quest-finale'
import { SpawnQuest } from './spawn-quest'
import { TribeShow } from './tribes-show'
import { ContextUser } from './utils/context-user'
import { Voting } from './vote-idea'

export interface Tribalizm {
    addIdea: Omit<AddIdea, keyof ContextUser>
    brainstormLifecycle: Omit<BrainstormLifecycle, keyof ContextUser>
    gateringAcknowledge: Omit<GateringAcknowledge, keyof ContextUser>
    gatheringDeclare: Omit<GatheringDeclare, keyof ContextUser>
    gatheringFinale: Omit<GatheringFinale, keyof ContextUser>
    initiation: Omit<Initiation, keyof ContextUser>
    introductionQuests: Omit<IntroductionQuests, keyof ContextUser>
    ideasIncarnation: Omit<IdeasIncarnation, keyof ContextUser>
    tribeApplication: Omit<TribeApplication, keyof ContextUser>
    tribesShow: Omit<TribeShow, keyof ContextUser>
    questNegotiation: Omit<QuestNegotiation, keyof ContextUser>
    questFinale: Omit<QuestFinale, keyof ContextUser>
    spawnQuest: Omit<SpawnQuest, keyof ContextUser>
    voting: Omit<Voting, keyof ContextUser>
}

export function wrapWithErrorHandler(
    tribalism: Tribalizm,
    handler: (error: Error) => void
) {
    return Object.entries(tribalism).reduce((tr, [key, useCase]) => {
        return { ...tr, [key]: proxy(useCase) }
    }, {}) as Tribalizm
    function proxy(obj: any) {
        return Object.entries(obj).reduce((r, [k, v]) => {
            if (typeof v === 'function') {
                const fn = function (...args: any[]) {
                    const value = v.apply(obj, args)
                    if ('catch' in value && typeof value.catch === 'function') {
                        return new Promise((resolve, reject) =>
                            value.then(resolve).catch(reject)
                        ).catch(handler)
                    }
                    return value
                }
                return { ...r, [k]: fn }
            }
            return { ...r, [k]: v }
        }, {})
    }
}
