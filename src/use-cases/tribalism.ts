import { AddIdea } from './add-idea'
import { TribeApplication } from './apply-tribe'
import { BrainstormLifecycle } from './brainstorm-lifecycle'
import { GatheringAcknowledge } from './gathering-acknowledge'
import { GatheringDeclare } from './gathering-declare'
import { GatheringFinale } from './gathering-finale'
import { IdeasIncarnation } from './incarnate-ideas'
import { Initiation } from './initiation'
import { IntroductionQuests } from './introduction-quests'
import { LocateUser } from './locate-user'
import { QuestNegotiation } from './negotiate-quest'
import { QuestFinale } from './quest-finale'
import { SpawnQuest } from './spawn-quest'
import { TribeShow } from './tribes-show'
import { Context } from './utils/context'
import { ContextUser } from './utils/context-user'
import { Voting } from './vote-idea'

export interface Tribalizm {
    addIdea: Omit<AddIdea, keyof ContextUser>
    brainstormLifecycle: Omit<BrainstormLifecycle, keyof ContextUser>
    gatheringAcknowledge: Omit<GatheringAcknowledge, keyof ContextUser>
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
    locateUser: Omit<LocateUser, keyof ContextUser>
}

export function makeTribalizm(context: Context) {
    return {
        addIdea: new AddIdea(context),
        brainstormLifecycle: new BrainstormLifecycle(context),
        gatheringAcknowledge: new GatheringAcknowledge(context),
        gatheringDeclare: new GatheringDeclare(context),
        gatheringFinale: new GatheringFinale(context),
        initiation: new Initiation(context),
        introductionQuests: new IntroductionQuests(context),
        ideasIncarnation: new IdeasIncarnation(context),
        tribeApplication: new TribeApplication(context),
        tribesShow: new TribeShow(context),
        questNegotiation: new QuestNegotiation(context),
        questFinale: new QuestFinale(context),
        spawnQuest: new SpawnQuest(context),
        voting: new Voting(context),
        locateUser: new LocateUser(context),
    }
}
