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
    initiation: {
        declinePrompt:
            'Please describe in a few words why did you decline an appliaction.',
        declineOk: 'Ok, appliaction has been declined',
        questNotification:
            '{name}, {elder} of the {tribe} proposes to meet: \n {proposal}',
        elders: {
            chief: 'chief',
            shaman: 'shaman',
        },
        candidate: 'candidate',
    },
    introduction: {
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
}

export default en
