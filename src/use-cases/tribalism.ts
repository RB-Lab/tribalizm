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
import { QuestSource } from './quest-source'
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
    questSource: Omit<QuestSource, keyof ContextUser>
    voting: Omit<Voting, keyof ContextUser>
}
