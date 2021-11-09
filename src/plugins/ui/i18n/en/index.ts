import type { BaseTranslation } from '../i18n-types'

const en: BaseTranslation = {
    start: {
        text: 'Join tribes of likelly-minded people nearby!',
        buttons: {
            rules: 'Game rules',
            list: 'List tribes',
        },
    },
    rules: {
        apply: {
            text:
                'To join a tribe you like you must send application. ' +
                "Tribe's chief and shaman will consider it and invite you to have a conversation with them. " +
                'If they decide that you allign with the tribe spirit well, they will let you join',
            buttons: {
                onShaman: 'Who is shaman?',
                onChief: 'Who is chief?',
                next: "What's next?",
                start: "Let's start!",
            },
        },
        onChief: {
            text: "Chief is the most charismatic person in the tribe. Their duties is to maintain tribe's integrity.",
            buttons: {
                back: '← Back',
                start: "Let's start!",
            },
        },
        onShaman: {
            text: "Shaman is the most wise person in the tribe. Thier duities is to assist tribe's chief.",
            buttons: {
                back: '← Back',
                start: "Let's start!",
            },
        },
        inTribe: {
            text: `Now, when you're in tribe you can participate in brainstorm and tribe's quests`,
            buttons: {
                onBrainsotrm: 'What is brainstorm?',
                onQuests: 'Who are quests?',
                back: '← Back',
                start: "Let's start!",
            },
        },
        onBrainsotrm: {
            text:
                'In a brainstorm you will suggest activities for the tribe and vote for activities you like' +
                'You will be notified when next brainstorm is on the horizon!',
            buttons: {
                back: '← Back',
                start: "Let's start!",
            },
        },
        onQuests: {
            text: `Quests are tribe's activities. Those could be practical tasks, or just gatherings to hang out with your fellows`,
            buttons: {
                back: '← Back',
                start: "Let's start!",
            },
        },
    },
    tribesList: {
        requestLocationText: 'What is the city you\re in?',
        requestLocation: 'Share my location',
        apply: 'Send application',
        count: 'Members count:',
        searchIn: 'Searchin in city: {city}',
        applyText:
            'Please, write tribe\'s chief and shaman about yourself and why do you want to join "{tribe}" tribe?',
        applicationSent:
            'Your application has been sent. Tribe chief will propose a meeting soon.',
        applicationSentShort: 'Application has been sent',
    },
    initiation: {
        declineText:
            'Please describe in a few words why did you decline an appliaction.',
        declinedForElder: 'Ok, appliaction has been declined',
        proposeDate: "📅 Select a date, when you'd like to meet the candidate",
        proposeTimeHours: '🕘 Choose an hour of the day',
        proposeTimeMinutes: '🕤 Choose minutes',
        proposePlace: '🗿 Now where you want to meet?',
        proposal:
            'You propose to meet\n • Time: {date:Date|date}\n • Place: {place}',
        confirm: '✅ Okay',
        edit: '🤔 Edit',
        proposeOther: '🤔 Propose other date/time',
        weekdays: 'Su,Mo,Tu,We,Th,Fr,St',
        months: 'January,February,March,April,May,June,July,August,September,October,November,December',
        startWeekDay: '0',
        proposalDone: 'Ok, proposal has been sent.',
    },
    notifications: {
        tribeAppliaction: {
            title: 'A new member appliaction for tribe {tribe}!',
            applicant: 'From user {username}.',
            coverLetter: 'Cover leter:',
            assignInitiation: 'Propose a meeting',
            decline: 'Decline',
            declinedForApplicant:
                'Your appliaction to the tribe "{tribe}" has been declined',
        },
    },
}

export default en
