import type { BaseTranslation } from '../i18n-types'

const en: BaseTranslation = {
    unhandledText: 'πΏ Spirits may hear you...',
    buttons: {
        back: 'β Back',
    },
    start: {
        text: 'Join tribes of likely-minded people nearby!',
        profile: 'My Tribalizm profile',
        myTribes: 'My tribes',
        buttons: {
            rules: 'βΉοΈ  Game rules',
            list: 'π List tribes',
            myTribes: 'My tribes',
        },
    },
    rules: {
        buttons: {
            back: 'β Back',
            start: "π Let's start!",
            onBrainstorm: "What's brainstorm?",
            onQuests: "What's quest?",
            onAstral: "Whats's Astral",
            next: "What's next?",
        },
        apply:
            'To join a tribe you like you must send an application. ' +
            'Other tribe members will consider it and invite you to have a conversation with them. ' +
            'If they decide that you align with the tribe spirit well, they will let you join.' +
            "If you didn't find tribe you'd like, try to search in Astral",
        onAstral:
            'Astral is the place for "virtual" tribes. You can still meet likely-minded people ' +
            "via video chats in case your city doesn't have enough of them. As soon as there's enough people in your" +
            'tribe is incarnated in real world.',
        inTribe: `Now, when you're in tribe you can participate in brainstorm and tribe's quests`,
        onBrainstorm:
            'In a brainstorm you will suggest activities for the tribe and vote for activities you like' +
            'You will be notified when next brainstorm is on the horizon!',
        onQuests: `Quests are tribe's activities. Those could be practical tasks, or just gatherings to hang out with your fellows`,
    },
    tribesList: {
        requestLocationText: "What is the city you're in?",
        requestLocation: 'π Share my location',
        apply: 'π Send application',
        more: 'Moreβ¦',
        count: 'Members count:',
        searchIn: 'Tribes in {city}: ',
        searchInAstral: 'Tribes in Astral',
        applyText:
            'Please, write about yourself and why do you want to join "{tribe}" tribe?',
        applicationSent:
            'π¨ Your application has been sent. One of tribe member will propose a meeting soon.',
        applicationSentShort: 'βοΈ Ok!',
        cantFindCity: "π€ Can't find your city, please type it's name.",
        unknownCity: 'π€ Cannot find such a city',
        nothingFound: 'π¨ No tribes in {city} so far...',
        createTribe: 'πͺ Create a new tribe',
        searchAstral: 'β¨ Look in Astral',
        noTribesInAstral: 'π¨ No tribes in Astral yet',
        tribeNamePrompt: "What is tribe's name?",
        tribeDescriptionPrompt: 'What does this tribe do?',
        tribeCreated: 'π A new tribe created.',
        joinLink: 'Join the tribe!',
        uploadLogo: 'Upload tribe image',
        skipImage: 'β© Skip image',
        thereMore: "There's more tribes...",
        loadMore: 'Next',
        tribeListEnd: "That's all.",
    },
    initiation: {
        declinePrompt:
            'Please describe in a few words why did you decline an application.',
        declineOk: 'Ok, application has been declined',
        approvedOk: "Ok, you've approved the application",
        questNotification:
            '{name:string} of the {tribe:string} proposes to meet: \n {proposal:string}',
        questNotificationForElder:
            'Candidate for {tribe:string} tribe {name:string} proposes to meet: \n {proposal:string}',
        feedbackRequest:
            "You've just met with {name:string}. Do you accept them in the tribe {tribe:string}?",
        accept: 'π Yes, accept!',
        decline: 'π No, decline.',
        applicationApproved:
            "π Hooray! You've been accepted in {tribe:string} tribe! You'll meet with other members soon.",
    },
    introduction: {
        newMemberNotice:
            "π New member {name:string} in {tribe:string}! Let's arrange an introduction meeting!",
        okay: "π€ Yes, let's meet!",
        questNotification:
            '{name} of the {tribe:string} proposes to meet to introduce themselves: \n {proposal:string}',
    },
    coordination: {
        coordinateOwnIdea: `You're going to coordinate efforts to incarnate your idea "{description:string}" with {name:string}. We need to arrange first meeting.`,
        okay: "πͺ Yay! Le'ts do it!",
        questNotification:
            '{name} of the {tribe:string} proposes to meet to coordinate efforts for "{description:string}": \n {proposal:string}',
        coordinateSpawned: `New quest "{description:string}" assigned to you and {name:string}. Let's arrange a meeting!`,
        questManage: 'When discuss with {name: string}, you can:',
        buttons: {
            spawn: 'Create a sub-quest',
            gatherUpwoters: 'Gather idea supporters',
            gatherTribe: 'Gather whole tribe',
            reQuest: 'Meet one more time',
        },
        spawnDescribe: 'Describe the quest, please',
        questAssigned: 'π Ok, quest assigned',
        gatheringDescribe: 'Describe the reason for gathering',
        gatheringWhen: 'When do you want to gather?',
        gatheringSetPlace: "Where you'd like to met?",
        what: {
            all: 'tribe',
            upvoters: 'all interested members',
        },
        confirmPrompt:
            'Gather {what:string} for "{description:string}" at: \n {proposal:string}',
        proposal: ' β’ Time: {date:Date|date}\n β’ Place: {place}',
        confirm: 'β Yes',
        edit: 'π€ Change',
        gatheringDone: 'Ok, I proclaim the gathering!',
    },
    gathering: {
        declared: `New gathering for "{reason:string}": \n {proposal:string}`,
        proposal: ' β’ Time: {date:Date|date}\n β’ Place: {place}',
        accept: 'Acknowledge',
        decline: 'Decline',
        accepted: 'βΊοΈ Cool! See ya there!',
        declined: "π₯Ί Ahh, that's a pity...",
        ratePrompt: 'How was the gathering?',
        rates: { '0': 'π©', '1': 'π', '2': 'π', '3': 'π', '4': 'π₯°' },
        rateDone: 'Ok, gathering coordinators have been properly acknowledged',
    },
    calendar: {
        weekdays: 'Su,Mo,Tu,We,Th,Fr,St',
        months: 'January,February,March,April,May,June,July,August,September,October,November,December',
        startWeekDay: '0',
        proposeTimeHours: 'π Choose an hour of the day',
        proposeTimeMinutes: 'π€ Choose minutes',
    },
    questNegotiation: {
        proposeDate: "π Select a date, when you'd like to meet",
        proposeTimeHours: 'π Choose an hour of the day',
        proposeTimeMinutes: 'π€ Choose minutes',
        proposePlace: 'π Now where you want to meet?',
        proposal: ' β’ Time: {date:Date|date}\n β’ Place: {place}',
        proposalConfirmPrompt: 'You propose to meet: \n {proposal}',
        confirm: 'β Okay',
        edit: 'π€ Edit',
        proposeOther: 'π€ Suggest otherwise',
        proposalDone: 'π¨ Ok, proposal has been sent.',
        proposalAgreed: "π¨ Ok, I'll notify the other participant{{s}}",
        proposalAgreedPersonal: "π¨ Ok, I'll notify {who:string}",
        questAccepted:
            'All participants agreed to meet for "{description:string}" at: \n {proposal:string}',
        questAcceptedPersonal:
            '{who:string} agreed to meet at: \n {proposal:string}',
    },
    tribeApplication: {
        title: 'A new member application for tribe {tribe}!',
        applicant: 'From user {username}.',
        coverLetter: 'Cover letter:',
        assignInitiation: 'π Propose a meeting',
        decline: 'βοΈ Decline',
        applicationDeclined:
            'Your application to the tribe "{tribe}" has been declined',
    },
    help: {
        unknown: "Can't find this topic",
        whatIsTribalizm: 'What is Tribalizm Bot?',
        whatIsTribalizmText:
            'Tribalizm is a bot that facilitates real life connections in' +
            'local communities, called "tribes" (e.g. "pop science lovers" or "electric transport' +
            ' enthusiasts").\n' +
            'Each new member of the tribe meets other members tet-a-tet in time of "initiation" ' +
            "thus when it's time for gathering everybody already knows each other\n" +
            'From time to time a brainstorm is declared where all tribe members can suggest ideas ' +
            'of activities (from simple, lik "meet in pub or park" or "discuss new Dawkins paper" ' +
            'to more viable ones like "get lobbied new charging station"). Most popular ideas are ' +
            'to be implemented for which tribe members get the quests.',
    },
    brainstorm: {
        timeToStorm: "β It's Time To STORM!!!",
        toStormButton: "β‘οΈβ‘οΈ Let's start it β‘οΈβ‘οΈ",
        proposeDate: 'π Select a date, when to start brainstorm',
        proposeTimeHours: 'π Choose an hour of the day',
        proposeTimeMinutes: 'π€ Choose minutes',
        confirmPrompt: 'Start brainstorm at {date:Date|date}?',
        confirm: 'β Okay',
        edit: 'π€ Edit',
        done: "β Ok. I'll arrange brainstorm β",
        brainstormDeclared: 'β New brainstorm is coming on {date:Date|date} β',
        brainstormNotice:
            'β There is a brainstorm on the horizon: {date:Date|date}! β',
        started: 'Brainstorm started! Propose your ideas! π₯',
        toVote: "Brainstorm is over, it's time to vote for ideas!",
        end: 'Storm ended! Most popular ideas are to be incarnated.',
    },

    errors: {
        UpdateFinishedBrainstormError: 'π« This brainstorm is already over.',
        SelfVotingIdeaError: 'π« You cannot vote for your own idea.',
        DoubleVotingError: 'Cannot vote twice.',
        UpdateFinishedIdeaError:
            'This idea already in implementation (or implemented).',
        InvalidTimeProposal: 'It is impossible to meet at that time!',
        InvalidAcceptanceTime: 'π€¬  InvalidAcceptanceTime? π€¨',
        NotYourQuest: 'π« Nope. This is not your quest.',
        IndeclinableError: 'You cannot decline this type of quests.',
        QuestIncompleteError:
            'Cannot agree on quest with incomplete information.',
        NotParticipated: "π« Nope. You cannot vote for gathering you' declined",
        VoteRangeError: 'This vote is out of available range.',
        SelfVotingError: 'π« Nope. You cannot rate yourself',
        ApplicationTransitionError: 'π€¬  ApplicationTransitionError? π€¨',
        EntityNotFound: 'π€¨ 404. Not found. What did you try to find?',
        NotYourTribe: 'π« Nope. You are not from this tribe (any more?).',
        NoIdeaError: 'π€¬ NoIdeaError? π€¨',
        WrongQuestError: 'π€¬ WrongQuestError? π€¨',
        WrongPhaseError: 'π« Sorry, you cannot change application process now.',
        VotingNotStartedError: 'π« Voting is not started yet',
        ExternalMemberVoteError:
            'π« Nope. You are not from this tribe (any more?).',
        NotEnoughMembers: 'π€¬ NotEnoughMembers? π€¨',
        FinalizeBeforeVotingError:
            'π€¬ System error! Cannot finalize storm before voting',
        StormNotStarted:
            'π€¬ System error! Cannot add idea: brainstorm is not raging',
        QuestFinishedError: 'π« This quest is already over',
        common: 'β οΈ Oops! Something awfully happened.',
        commonWithText: 'β οΈ Oops! {message:string}',
    },
}

export default en
