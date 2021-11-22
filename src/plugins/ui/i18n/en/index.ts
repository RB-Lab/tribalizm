import type { BaseTranslation } from '../i18n-types'

const en: BaseTranslation = {
    start: {
        text: 'Join tribes of likelly-minded people nearby!',
        buttons: {
            rules: 'ℹ️  Game rules',
            list: '📜 List tribes',
        },
    },
    rules: {
        buttons: {
            back: '← Back',
            start: "🚀 Let's start!",
            onBrainsotrm: 'What is brainstorm?',
            onQuests: 'Who are quests?',
            onShaman: 'Who is shaman?',
            onChief: 'Who is chief?',
            next: "What's next?",
        },
        apply:
            'To join a tribe you like you must send application. ' +
            "Tribe's chief and shaman will consider it and invite you to have a conversation with them. " +
            'If they decide that you allign with the tribe spirit well, they will let you join',
        onChief:
            "Chief is the most charismatic person in the tribe. Their duties is to maintain tribe's integrity.",
        onShaman:
            "Shaman is the most wise person in the tribe. Thier duities is to assist tribe's chief.",
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
        searchIn: 'Searchin in {city}: ',
        applyText:
            'Please, write tribe\'s chief and shaman about yourself and why do you want to join "{tribe}" tribe?',
        applicationSent:
            '📨 Your application has been sent. Tribe chief will propose a meeting soon.',
        applicationSentShort: '📨 Application has been sent',
    },
    elders: {
        chief: 'chief',
        shaman: 'shaman',
    },
    initiation: {
        declinePrompt:
            'Please describe in a few words why did you decline an appliaction.',
        declineOk: 'Ok, appliaction has been declined',
        approvedOk: "Ok, you've approved the application",
        questNotification:
            '{name:string}, {elder:string} of the {tribe:string} proposes to meet: \n {proposal:string}',
        candidate: 'candidate',
        questDescription: 'initiation',
        feedbackRequest:
            "You've just met with {name:string}. Do you accept them in the tribe {tribe:string}?",
        accept: '👍 Yes, accept!',
        decline: '👎 No, decline.',
        appliactionApproved:
            "🎉 Hooray! You've been accepted in {tribe:string} tribe! You'll meet with other members soon.",
    },
    introduction: {
        newMemberNotice:
            "🎉 New member {name:string} in {tribe:string}! Let's arrange an introduction meeting!",
        okay: "🤗 Yes, let's meet!",
        questDescription: 'introduction meeting',
        questNotification:
            '{name}, member of the {tribe} proposes to meet: \n {proposal}',
    },
    calendar: {
        weekdays: 'Su,Mo,Tu,We,Th,Fr,St',
        months: 'January,February,March,April,May,June,July,August,September,October,November,December',
        startWeekDay: '0',
    },
    questNegotiation: {
        proposeDate: "📅 Select a date, when you'd like to meet",
        proposeTimeHours: '🕘 Choose an hour of the day',
        proposeTimeMinutes: '🕤 Choose minutes',
        proposePlace: '🌍 Now where you want to meet?',
        proposal: ' • Time: {date:Date|date}\n • Place: {place}',
        proposalConfirmPrompt: 'You propose to meet: \n {proposal}',
        proposalRecieved:
            '{who} of {tribe} tribe proposes to meet for "{description}": \n {proposal}',
        confirm: '✅ Okay',
        edit: '🤔 Edit',
        proposeOther: '🤔 Suggest otherwise',
        proposalDone: '📨 Ok, proposal has been sent.',
        proposalAgreed: "📨 Ok, I'll notify the other participant{{s}}",
        proposalAgreedPersonal: "📨 Ok, I'll notify {who:string}",
        questAccepted:
            'All particiepan agreed to meet for "{description:string}" at: \n {proposal:string}',
        questAcceptedPersonal:
            '{who:string} aggred to meet at: \n {proposal:string}',
    },
    notifications: {
        tribeAppliaction: {
            title: 'A new member appliaction for tribe {tribe}!',
            applicant: 'From user {username}.',
            coverLetter: 'Cover leter:',
            assignInitiation: '👍 Propose a meeting',
            decline: '⛔️ Decline',
            applicationDeclined:
                'Your appliaction to the tribe "{tribe}" has been declined',
        },
    },
    rateMember: {
        elderCharismaPrompt:
            "You've just meat {tribe:string} {elder:string}, how charismatic they are?",
        charismaPrompt:
            "You've just meat {name: string}, how charismatic they are?",
        wisdomPrompt: 'How wise they are?',
        help: 'ℹ️',
        charisma: { '0': '😩', '1': '😕', '2': '🤔', '3': '🤩', '4': '🔥' },
        wisdom: { '0': '🤪', '1': '🤥', '2': '🤔', '3': '🥸', '4': '🦉' },
        done: 'Got it! Your scores will be applied soon',
    },
    errors: {
        // TODO fill other errors texts!!
        UpdateFinishedBrainstormError: '',
        SelfVotingIdeaError: '',
        DoubelVotingError: '',
        UpdateFinishedIdeaError: '',
        InvalidTimeProposal: '',
        InvalidAcceptanceTime: '',
        NotYourQuest: '',
        IndeclinableError: '',
        QuestIncompleteError: '',
        NotParticipated: '',
        VoteRangeError: '',
        SelfVotingError: '',
        ApplicationTransitionError: '',
        NoChiefTribeError: '',
        EntityNotFound: '',
        NotYourTribe: '',
        NoIdeaError: '',
        AlreadyHaveChief: '',
        ElderMismatchError: '',
        WrongQuestError: '',
        NoChiefSetError: '🤨 Hmm... this tribe has no chief.',
        NoShamanSetError: '',
        WrongPhaseError: '🚫 Sorry, you cannot change application process now.',
        VotingNotStartedError: '',
        ExternalMemberVoteError: '',
        NotEnoughMembers: '',
        NotAChiefError: '',
        common: '😩 Oooops! Something awfull happend.',
    },
}

export default en
