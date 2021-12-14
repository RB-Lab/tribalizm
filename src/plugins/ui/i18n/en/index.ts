import type { BaseTranslation } from '../i18n-types'

const en: BaseTranslation = {
    unhandledText: '🗿 Spirits may hear you...',
    start: {
        text: 'Join tribes of likely-minded people nearby!',
        buttons: {
            rules: 'ℹ️  Game rules',
            list: '📜 List tribes',
        },
    },
    rules: {
        buttons: {
            back: '← Back',
            start: "🚀 Let's start!",
            onBrainstorm: 'What is brainstorm?',
            onQuests: 'Who are quests?',
            onShaman: 'Who is shaman?',
            onChief: 'Who is chief?',
            next: "What's next?",
        },
        apply:
            'To join a tribe you like you must send application. ' +
            "Tribe's chief and shaman will consider it and invite you to have a conversation with them. " +
            'If they decide that you align with the tribe spirit well, they will let you join',
        onChief:
            "Chief is the most charismatic person in the tribe. Their duties is to maintain tribe's integrity.",
        onShaman:
            "Shaman is the most wise person in the tribe. Their duties is to assist tribe's chief.",
        inTribe: `Now, when you're in tribe you can participate in brainstorm and tribe's quests`,
        onBrainstorm:
            'In a brainstorm you will suggest activities for the tribe and vote for activities you like' +
            'You will be notified when next brainstorm is on the horizon!',
        onQuests: `Quests are tribe's activities. Those could be practical tasks, or just gatherings to hang out with your fellows`,
    },
    tribesList: {
        requestLocationText: "What is the city you're in?",
        requestLocation: '🌍 Share my location',
        apply: '🚀 Send application',
        count: 'Members count:',
        searchIn: 'Tribes in {city}: ',
        applyText:
            'Please, write tribe\'s chief and shaman about yourself and why do you want to join "{tribe}" tribe?',
        applicationSent:
            '📨 Your application has been sent. Tribe chief will propose a meeting soon.',
        applicationSentShort: '☑️ Ok!',
        cantFindCity: "🤔 Can't find your city, please type it's name.",
        unknownCity: '🤔 Cannot find such a city',
        nothingFound: '💨 No tribes in {city} so far...',
    },
    elders: {
        chief: 'chief',
        shaman: 'shaman',
    },
    initiation: {
        declinePrompt:
            'Please describe in a few words why did you decline an application.',
        declineOk: 'Ok, application has been declined',
        approvedOk: "Ok, you've approved the application",
        questNotification:
            '{name:string}, {elder:string} of the {tribe:string} proposes to meet: \n {proposal:string}',
        questNotificationForElder:
            'Candidate for {tribe:string} tribe {name:string} proposes to meet: \n {proposal:string}',
        feedbackRequest:
            "You've just met with {name:string}. Do you accept them in the tribe {tribe:string}?",
        accept: '👍 Yes, accept!',
        decline: '👎 No, decline.',
        applicationApproved:
            "🎉 Hooray! You've been accepted in {tribe:string} tribe! You'll meet with other members soon.",
    },
    introduction: {
        newMemberNotice:
            "🎉 New member {name:string} in {tribe:string}! Let's arrange an introduction meeting!",
        okay: "🤗 Yes, let's meet!",
        questNotification:
            '{name} of the {tribe:string} proposes to meet to introduce themselves: \n {proposal:string}',
    },
    coordination: {
        coordinateOwnIdea: `You're going to coordinate efforts to incarnate your idea "{description:string}" with {name:string}. We need to arrange first meeting.`,
        okay: "💪 Yay! Le'ts do it!",
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
        questAssigned: '👌 Ok, quest assigned',
        gatheringDescribe: 'Describe the reason for gathering',
        gatheringWhen: 'When do you want to gather?',
        gatheringSetPlace: "Where you'd like to met?",
        what: {
            all: 'tribe',
            upvoters: 'all interested members',
        },
        confirmPrompt:
            'Gather {what:string} for "{description:string}" at: \n {proposal:string}',
        proposal: ' • Time: {date:Date|date}\n • Place: {place}',
        confirm: '✅ Yes',
        edit: '🤔 Change',
        gatheringDone: 'Ok, I proclaim the gathering!',
    },
    gathering: {
        declared: `New gathering for "{reason:string}": \n {proposal:string}`,
        proposal: ' • Time: {date:Date|date}\n • Place: {place}',
        accept: 'Acknowledge',
        decline: 'Decline',
        accepted: '☺️ Cool! See ya there!',
        declined: "🥺 Ahh, that's a pity...",
        ratePrompt: 'How was the gathering?',
        rates: { '0': '😩', '1': '😒', '2': '😐', '3': '😌', '4': '🥰' },
        rateDone: 'Ok, gathering coordinators have been properly acknowledged',
    },
    calendar: {
        weekdays: 'Su,Mo,Tu,We,Th,Fr,St',
        months: 'January,February,March,April,May,June,July,August,September,October,November,December',
        startWeekDay: '0',
        proposeTimeHours: '🕘 Choose an hour of the day',
        proposeTimeMinutes: '🕤 Choose minutes',
    },
    questNegotiation: {
        proposeDate: "📅 Select a date, when you'd like to meet",
        proposeTimeHours: '🕘 Choose an hour of the day',
        proposeTimeMinutes: '🕤 Choose minutes',
        proposePlace: '🌍 Now where you want to meet?',
        proposal: ' • Time: {date:Date|date}\n • Place: {place}',
        proposalConfirmPrompt: 'You propose to meet: \n {proposal}',
        confirm: '✅ Okay',
        edit: '🤔 Edit',
        proposeOther: '🤔 Suggest otherwise',
        proposalDone: '📨 Ok, proposal has been sent.',
        proposalAgreed: "📨 Ok, I'll notify the other participant{{s}}",
        proposalAgreedPersonal: "📨 Ok, I'll notify {who:string}",
        questAccepted:
            'All participants agreed to meet for "{description:string}" at: \n {proposal:string}',
        questAcceptedPersonal:
            '{who:string} agreed to meet at: \n {proposal:string}',
    },
    tribeApplication: {
        title: 'A new member application for tribe {tribe}!',
        applicant: 'From user {username}.',
        coverLetter: 'Cover letter:',
        assignInitiation: '👍 Propose a meeting',
        decline: '⛔️ Decline',
        applicationDeclined:
            'Your application to the tribe "{tribe}" has been declined',
    },
    rateMember: {
        elderCharismaPrompt:
            "You've just meet {tribe:string} {elder:string}, how charismatic they are?",
        charismaPrompt:
            "You've just meet {name: string}, how charismatic they are?",
        wisdomPrompt: 'How wise they are?',
        help: 'ℹ️',
        charisma: { '0': '😩', '1': '😕', '2': '🤔', '3': '🤩', '4': '🔥' },
        wisdom: { '0': '🤪', '1': '🤥', '2': '🤔', '3': '🥸', '4': '🦉' },
        done: 'Got it! Your scores will be applied soon',
    },
    brainstorm: {
        timeToStorm: "⛈ It's Time To STORM!!!",
        toStormButton: "⚡️⚡️ Let's start it ⚡️⚡️",
        proposeDate: '📅 Select a date, when to start brainstorm',
        proposeTimeHours: '🕘 Choose an hour of the day',
        proposeTimeMinutes: '🕤 Choose minutes',
        confirmPrompt: 'Start brainstorm at {date:Date|date}?',
        confirm: '✅ Okay',
        edit: '🤔 Edit',
        done: "⛈ Ok. I'll arrange brainstorm ⛈",
        brainstormDeclared: '⛈ New brainstorm is coming on {date:Date|date} ⛈',
        brainstormNotice:
            '⛈ There is a brainstorm on the horizon: {date:Date|date}! ⛈',
        started: 'Brainstorm started! Propose your ideas! 💥',
        toVote: "Brainstorm is over, it's time to vote for ideas!",
        end: 'Storm ended! Most popular ideas are to be incarnated.',
    },

    errors: {
        // TODO fill other errors texts!!
        UpdateFinishedBrainstormError: '🚫 This brainstorm is already over.',
        SelfVotingIdeaError: '🚫 You cannot vote for your own idea.',
        DoubleVotingError: 'Cannot vote twice.',
        UpdateFinishedIdeaError:
            'This idea already in implementation (or implemented).',
        InvalidTimeProposal: 'It is impossible to meet at that time!',
        InvalidAcceptanceTime: '🤬  InvalidAcceptanceTime? 🤨',
        NotYourQuest: '🚫 Nope. This is not your quest.',
        IndeclinableError: 'You cannot decline this type of quests.',
        QuestIncompleteError:
            'Cannot agree on quest with incomplete information.',
        NotParticipated: "🚫 Nope. You cannot vote for gathering you' declined",
        VoteRangeError: 'This vote is out of available range.',
        SelfVotingError: '🚫 Nope. You cannot rate yourself',
        ApplicationTransitionError: '🤬  ApplicationTransitionError? 🤨',
        NoChiefTribeError: '🤨 Hmm... this tribe has no chief.',
        EntityNotFound: '🤨 404. Not found. What did you try to find?',
        NotYourTribe: '🚫 Nope. You are not from this tribe (any more?).',
        NoIdeaError: '🤬 NoIdeaError? 🤨',
        AlreadyHaveChief: '🤨 Hmm... this tribe already has a chief.',
        ElderMismatchError: '🤬 ElderMismatchError? 🤨',
        WrongQuestError: '🤬 WrongQuestError? 🤨',
        NoChiefSetError: '🤨 Hmm... this tribe has no chief.',
        NoShamanSetError: '🤨 Hmm... this tribe has no shaman.',
        WrongPhaseError: '🚫 Sorry, you cannot change application process now.',
        VotingNotStartedError: '🚫 Voting is not started yet',
        ExternalMemberVoteError:
            '🚫 Nope. You are not from this tribe (any more?).',
        NotEnoughMembers: '🤬 NotEnoughMembers? 🤨',
        NotAChiefError:
            '🚫 Sorry, you cannot start a brainstorm, only tribe chief can',
        FinalizeBeforeVotingError:
            '🤬 System error! Cannot finalize storm before voting',
        StormNotStarted:
            '🤬 System error! Cannot add idea: brainstorm is not raging',
        QuestFinishedError: '🚫 This quest is already over',
        common: '☠️ Oops! Something awfully happened.',
        commonWithText: '☠️ Oops! {message:string}',
    },
}

export default en
