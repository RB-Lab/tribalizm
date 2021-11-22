// This file was auto-generated by 'typesafe-i18n'. Any manual changes will be overwritten.
/* eslint-disable */
import type { BaseTranslation as BaseTranslationType } from 'typesafe-i18n'
import type { LocalizedString } from 'typesafe-i18n'

export type BaseTranslation = BaseTranslationType
export type BaseLocale = 'en'

export type Locales =
	| 'en'
	| 'ru'

export type Translation = {
	'start': {	
		/**
		 * Join tribes of likelly-minded people nearby!
		 */
		'text': string
		'buttons': {	
			/**
			 * ℹ️  Game rules
			 */
			'rules': string
			/**
			 * 📜 List tribes
			 */
			'list': string
		}
	}
	'rules': {	
		'buttons': {	
			/**
			 * ← Back
			 */
			'back': string
			/**
			 * 🚀 Let's start!
			 */
			'start': string
			/**
			 * What is brainstorm?
			 */
			'onBrainsotrm': string
			/**
			 * Who are quests?
			 */
			'onQuests': string
			/**
			 * Who is shaman?
			 */
			'onShaman': string
			/**
			 * Who is chief?
			 */
			'onChief': string
			/**
			 * What's next?
			 */
			'next': string
		}
		/**
		 * To join a tribe you like you must send application. Tribe's chief and shaman will consider it and invite you to have a conversation with them. If they decide that you allign with the tribe spirit well, they will let you join
		 */
		'apply': string
		/**
		 * Chief is the most charismatic person in the tribe. Their duties is to maintain tribe's integrity.
		 */
		'onChief': string
		/**
		 * Shaman is the most wise person in the tribe. Thier duities is to assist tribe's chief.
		 */
		'onShaman': string
		/**
		 * Now, when you're in tribe you can participate in brainstorm and tribe's quests
		 */
		'inTribe': string
		/**
		 * In a brainstorm you will suggest activities for the tribe and vote for activities you likeYou will be notified when next brainstorm is on the horizon!
		 */
		'onBrainstorm': string
		/**
		 * Quests are tribe's activities. Those could be practical tasks, or just gatherings to hang out with your fellows
		 */
		'onQuests': string
	}
	'tribesList': {	
		/**
		 * What is the city you're in?
		 */
		'requestLocationText': string
		/**
		 * 🌍 Share my location
		 */
		'requestLocation': string
		/**
		 * 🚀 Send application
		 */
		'apply': string
		/**
		 * Members count:
		 */
		'count': string
		/**
		 * Searchin in {city}: 
		 * @param {unknown} city
		 */
		'searchIn': RequiredParams1<'city'>
		/**
		 * Please, write tribe's chief and shaman about yourself and why do you want to join "{tribe}" tribe?
		 * @param {unknown} tribe
		 */
		'applyText': RequiredParams1<'tribe'>
		/**
		 * 📨 Your application has been sent. Tribe chief will propose a meeting soon.
		 */
		'applicationSent': string
		/**
		 * 📨 Application has been sent
		 */
		'applicationSentShort': string
	}
	'elders': {	
		/**
		 * chief
		 */
		'chief': string
		/**
		 * shaman
		 */
		'shaman': string
	}
	'initiation': {	
		/**
		 * Please describe in a few words why did you decline an appliaction.
		 */
		'declinePrompt': string
		/**
		 * Ok, appliaction has been declined
		 */
		'declineOk': string
		/**
		 * Ok, you've approved the application
		 */
		'approvedOk': string
		/**
		 * {name}, {elder} of the {tribe} proposes to meet: 
	 {proposal}
		 * @param {string} elder
		 * @param {string} name
		 * @param {string} proposal
		 * @param {string} tribe
		 */
		'questNotification': RequiredParams4<'elder', 'name', 'proposal', 'tribe'>
		/**
		 * candidate
		 */
		'candidate': string
		/**
		 * initiation
		 */
		'questDescription': string
		/**
		 * You've just met with {name}. Do you accept them in the tribe {tribe}?
		 * @param {string} name
		 * @param {string} tribe
		 */
		'feedbackRequest': RequiredParams2<'name', 'tribe'>
		/**
		 * 👍 Yes, accept!
		 */
		'accept': string
		/**
		 * 👎 No, decline.
		 */
		'decline': string
		/**
		 * 🎉 Hooray! You've been accepted in {tribe} tribe! You'll meet with other members soon.
		 * @param {string} tribe
		 */
		'appliactionApproved': RequiredParams1<'tribe'>
	}
	'introduction': {	
		/**
		 * 🎉 New member {name} in {tribe}! Let's arrange an introduction meeting!
		 * @param {string} name
		 * @param {string} tribe
		 */
		'newMemberNotice': RequiredParams2<'name', 'tribe'>
		/**
		 * 🤗 Yes, let's meet!
		 */
		'okay': string
		/**
		 * introduction meeting
		 */
		'questDescription': string
		/**
		 * {name}, member of the {tribe} proposes to meet: 
	 {proposal}
		 * @param {unknown} name
		 * @param {unknown} proposal
		 * @param {unknown} tribe
		 */
		'questNotification': RequiredParams3<'name', 'proposal', 'tribe'>
	}
	'calendar': {	
		/**
		 * Su,Mo,Tu,We,Th,Fr,St
		 */
		'weekdays': string
		/**
		 * January,February,March,April,May,June,July,August,September,October,November,December
		 */
		'months': string
		/**
		 * 0
		 */
		'startWeekDay': string
	}
	'questNegotiation': {	
		/**
		 * 📅 Select a date, when you'd like to meet
		 */
		'proposeDate': string
		/**
		 * 🕘 Choose an hour of the day
		 */
		'proposeTimeHours': string
		/**
		 * 🕤 Choose minutes
		 */
		'proposeTimeMinutes': string
		/**
		 * 🌍 Now where you want to meet?
		 */
		'proposePlace': string
		/**
		 *  • Time: {date|date}
	 • Place: {place}
		 * @param {Date} date
		 * @param {unknown} place
		 */
		'proposal': RequiredParams2<'date|date', 'place'>
		/**
		 * You propose to meet: 
	 {proposal}
		 * @param {unknown} proposal
		 */
		'proposalConfirmPrompt': RequiredParams1<'proposal'>
		/**
		 * {who} of {tribe} tribe proposes to meet for "{description}": 
	 {proposal}
		 * @param {unknown} description
		 * @param {unknown} proposal
		 * @param {unknown} tribe
		 * @param {unknown} who
		 */
		'proposalRecieved': RequiredParams4<'description', 'proposal', 'tribe', 'who'>
		/**
		 * ✅ Okay
		 */
		'confirm': string
		/**
		 * 🤔 Edit
		 */
		'edit': string
		/**
		 * 🤔 Suggest otherwise
		 */
		'proposeOther': string
		/**
		 * 📨 Ok, proposal has been sent.
		 */
		'proposalDone': string
		/**
		 * 📨 Ok, I'll notify the other participant{{s}}
		 */
		'proposalAgreed': string
		/**
		 * 📨 Ok, I'll notify {who}
		 * @param {string} who
		 */
		'proposalAgreedPersonal': RequiredParams1<'who'>
		/**
		 * All particiepan agreed to meet for "{description}" at: 
	 {proposal}
		 * @param {string} description
		 * @param {string} proposal
		 */
		'questAccepted': RequiredParams2<'description', 'proposal'>
		/**
		 * {who} aggred to meet at: 
	 {proposal}
		 * @param {string} proposal
		 * @param {string} who
		 */
		'questAcceptedPersonal': RequiredParams2<'proposal', 'who'>
	}
	'notifications': {	
		'tribeAppliaction': {	
			/**
			 * A new member appliaction for tribe {tribe}!
			 * @param {unknown} tribe
			 */
			'title': RequiredParams1<'tribe'>
			/**
			 * From user {username}.
			 * @param {unknown} username
			 */
			'applicant': RequiredParams1<'username'>
			/**
			 * Cover leter:
			 */
			'coverLetter': string
			/**
			 * 👍 Propose a meeting
			 */
			'assignInitiation': string
			/**
			 * ⛔️ Decline
			 */
			'decline': string
			/**
			 * Your appliaction to the tribe "{tribe}" has been declined
			 * @param {unknown} tribe
			 */
			'applicationDeclined': RequiredParams1<'tribe'>
		}
	}
	'rateMember': {	
		/**
		 * You've just meat {tribe} {elder}, how charismatic they are?
		 * @param {string} elder
		 * @param {string} tribe
		 */
		'elderCharismaPrompt': RequiredParams2<'elder', 'tribe'>
		/**
		 * You've just meat {name}, how charismatic they are?
		 * @param {string} name
		 */
		'charismaPrompt': RequiredParams1<'name'>
		/**
		 * How wise they are?
		 */
		'wisdomPrompt': string
		/**
		 * ℹ️
		 */
		'help': string
		'charisma': {	
			/**
			 * 😩
			 */
			'0': string
			/**
			 * 😕
			 */
			'1': string
			/**
			 * 🤔
			 */
			'2': string
			/**
			 * 🤩
			 */
			'3': string
			/**
			 * 🔥
			 */
			'4': string
		}
		'wisdom': {	
			/**
			 * 🤪
			 */
			'0': string
			/**
			 * 🤥
			 */
			'1': string
			/**
			 * 🤔
			 */
			'2': string
			/**
			 * 🥸
			 */
			'3': string
			/**
			 * 🦉
			 */
			'4': string
		}
		/**
		 * Got it! Your scores will be applied soon
		 */
		'done': string
	}
	'errors': {	
		'UpdateFinishedBrainstormError': string
		'SelfVotingIdeaError': string
		'DoubelVotingError': string
		'UpdateFinishedIdeaError': string
		'InvalidTimeProposal': string
		'InvalidAcceptanceTime': string
		'NotYourQuest': string
		'IndeclinableError': string
		'QuestIncompleteError': string
		'NotParticipated': string
		'VoteRangeError': string
		'SelfVotingError': string
		'ApplicationTransitionError': string
		'NoChiefTribeError': string
		'EntityNotFound': string
		'NotYourTribe': string
		'NoIdeaError': string
		'AlreadyHaveChief': string
		'ElderMismatchError': string
		'WrongQuestError': string
		/**
		 * 🤨 Hmm... this tribe has no chief.
		 */
		'NoChiefSetError': string
		'NoShamanSetError': string
		/**
		 * 🚫 Sorry, you cannot change application process now.
		 */
		'WrongPhaseError': string
		'VotingNotStartedError': string
		'ExternalMemberVoteError': string
		'NotEnoughMembers': string
		'NotAChiefError': string
		/**
		 * 😩 Oooops! Something awfull happend.
		 */
		'common': string
	}
}

export type TranslationFunctions = {
	'start': {	
		/**
		 * Join tribes of likelly-minded people nearby!
		 */
		'text': () => LocalizedString
		'buttons': {	
			/**
			 * ℹ️  Game rules
			 */
			'rules': () => LocalizedString
			/**
			 * 📜 List tribes
			 */
			'list': () => LocalizedString
		}
	}
	'rules': {	
		'buttons': {	
			/**
			 * ← Back
			 */
			'back': () => LocalizedString
			/**
			 * 🚀 Let's start!
			 */
			'start': () => LocalizedString
			/**
			 * What is brainstorm?
			 */
			'onBrainsotrm': () => LocalizedString
			/**
			 * Who are quests?
			 */
			'onQuests': () => LocalizedString
			/**
			 * Who is shaman?
			 */
			'onShaman': () => LocalizedString
			/**
			 * Who is chief?
			 */
			'onChief': () => LocalizedString
			/**
			 * What's next?
			 */
			'next': () => LocalizedString
		}
		/**
		 * To join a tribe you like you must send application. Tribe's chief and shaman will consider it and invite you to have a conversation with them. If they decide that you allign with the tribe spirit well, they will let you join
		 */
		'apply': () => LocalizedString
		/**
		 * Chief is the most charismatic person in the tribe. Their duties is to maintain tribe's integrity.
		 */
		'onChief': () => LocalizedString
		/**
		 * Shaman is the most wise person in the tribe. Thier duities is to assist tribe's chief.
		 */
		'onShaman': () => LocalizedString
		/**
		 * Now, when you're in tribe you can participate in brainstorm and tribe's quests
		 */
		'inTribe': () => LocalizedString
		/**
		 * In a brainstorm you will suggest activities for the tribe and vote for activities you likeYou will be notified when next brainstorm is on the horizon!
		 */
		'onBrainstorm': () => LocalizedString
		/**
		 * Quests are tribe's activities. Those could be practical tasks, or just gatherings to hang out with your fellows
		 */
		'onQuests': () => LocalizedString
	}
	'tribesList': {	
		/**
		 * What is the city you're in?
		 */
		'requestLocationText': () => LocalizedString
		/**
		 * 🌍 Share my location
		 */
		'requestLocation': () => LocalizedString
		/**
		 * 🚀 Send application
		 */
		'apply': () => LocalizedString
		/**
		 * Members count:
		 */
		'count': () => LocalizedString
		/**
		 * Searchin in {city}: 
		 */
		'searchIn': (arg: { city: unknown }) => LocalizedString
		/**
		 * Please, write tribe's chief and shaman about yourself and why do you want to join "{tribe}" tribe?
		 */
		'applyText': (arg: { tribe: unknown }) => LocalizedString
		/**
		 * 📨 Your application has been sent. Tribe chief will propose a meeting soon.
		 */
		'applicationSent': () => LocalizedString
		/**
		 * 📨 Application has been sent
		 */
		'applicationSentShort': () => LocalizedString
	}
	'elders': {	
		/**
		 * chief
		 */
		'chief': () => LocalizedString
		/**
		 * shaman
		 */
		'shaman': () => LocalizedString
	}
	'initiation': {	
		/**
		 * Please describe in a few words why did you decline an appliaction.
		 */
		'declinePrompt': () => LocalizedString
		/**
		 * Ok, appliaction has been declined
		 */
		'declineOk': () => LocalizedString
		/**
		 * Ok, you've approved the application
		 */
		'approvedOk': () => LocalizedString
		/**
		 * {name}, {elder} of the {tribe} proposes to meet: 
	 {proposal}
		 */
		'questNotification': (arg: { elder: string, name: string, proposal: string, tribe: string }) => LocalizedString
		/**
		 * candidate
		 */
		'candidate': () => LocalizedString
		/**
		 * initiation
		 */
		'questDescription': () => LocalizedString
		/**
		 * You've just met with {name}. Do you accept them in the tribe {tribe}?
		 */
		'feedbackRequest': (arg: { name: string, tribe: string }) => LocalizedString
		/**
		 * 👍 Yes, accept!
		 */
		'accept': () => LocalizedString
		/**
		 * 👎 No, decline.
		 */
		'decline': () => LocalizedString
		/**
		 * 🎉 Hooray! You've been accepted in {tribe} tribe! You'll meet with other members soon.
		 */
		'appliactionApproved': (arg: { tribe: string }) => LocalizedString
	}
	'introduction': {	
		/**
		 * 🎉 New member {name} in {tribe}! Let's arrange an introduction meeting!
		 */
		'newMemberNotice': (arg: { name: string, tribe: string }) => LocalizedString
		/**
		 * 🤗 Yes, let's meet!
		 */
		'okay': () => LocalizedString
		/**
		 * introduction meeting
		 */
		'questDescription': () => LocalizedString
		/**
		 * {name}, member of the {tribe} proposes to meet: 
	 {proposal}
		 */
		'questNotification': (arg: { name: unknown, proposal: unknown, tribe: unknown }) => LocalizedString
	}
	'calendar': {	
		/**
		 * Su,Mo,Tu,We,Th,Fr,St
		 */
		'weekdays': () => LocalizedString
		/**
		 * January,February,March,April,May,June,July,August,September,October,November,December
		 */
		'months': () => LocalizedString
		/**
		 * 0
		 */
		'startWeekDay': () => LocalizedString
	}
	'questNegotiation': {	
		/**
		 * 📅 Select a date, when you'd like to meet
		 */
		'proposeDate': () => LocalizedString
		/**
		 * 🕘 Choose an hour of the day
		 */
		'proposeTimeHours': () => LocalizedString
		/**
		 * 🕤 Choose minutes
		 */
		'proposeTimeMinutes': () => LocalizedString
		/**
		 * 🌍 Now where you want to meet?
		 */
		'proposePlace': () => LocalizedString
		/**
		 *  • Time: {date|date}
	 • Place: {place}
		 */
		'proposal': (arg: { date: Date, place: unknown }) => LocalizedString
		/**
		 * You propose to meet: 
	 {proposal}
		 */
		'proposalConfirmPrompt': (arg: { proposal: unknown }) => LocalizedString
		/**
		 * {who} of {tribe} tribe proposes to meet for "{description}": 
	 {proposal}
		 */
		'proposalRecieved': (arg: { description: unknown, proposal: unknown, tribe: unknown, who: unknown }) => LocalizedString
		/**
		 * ✅ Okay
		 */
		'confirm': () => LocalizedString
		/**
		 * 🤔 Edit
		 */
		'edit': () => LocalizedString
		/**
		 * 🤔 Suggest otherwise
		 */
		'proposeOther': () => LocalizedString
		/**
		 * 📨 Ok, proposal has been sent.
		 */
		'proposalDone': () => LocalizedString
		/**
		 * 📨 Ok, I'll notify the other participant{{s}}
		 */
		'proposalAgreed': (arg0: string | number | boolean) => LocalizedString
		/**
		 * 📨 Ok, I'll notify {who}
		 */
		'proposalAgreedPersonal': (arg: { who: string }) => LocalizedString
		/**
		 * All particiepan agreed to meet for "{description}" at: 
	 {proposal}
		 */
		'questAccepted': (arg: { description: string, proposal: string }) => LocalizedString
		/**
		 * {who} aggred to meet at: 
	 {proposal}
		 */
		'questAcceptedPersonal': (arg: { proposal: string, who: string }) => LocalizedString
	}
	'notifications': {	
		'tribeAppliaction': {	
			/**
			 * A new member appliaction for tribe {tribe}!
			 */
			'title': (arg: { tribe: unknown }) => LocalizedString
			/**
			 * From user {username}.
			 */
			'applicant': (arg: { username: unknown }) => LocalizedString
			/**
			 * Cover leter:
			 */
			'coverLetter': () => LocalizedString
			/**
			 * 👍 Propose a meeting
			 */
			'assignInitiation': () => LocalizedString
			/**
			 * ⛔️ Decline
			 */
			'decline': () => LocalizedString
			/**
			 * Your appliaction to the tribe "{tribe}" has been declined
			 */
			'applicationDeclined': (arg: { tribe: unknown }) => LocalizedString
		}
	}
	'rateMember': {	
		/**
		 * You've just meat {tribe} {elder}, how charismatic they are?
		 */
		'elderCharismaPrompt': (arg: { elder: string, tribe: string }) => LocalizedString
		/**
		 * You've just meat {name}, how charismatic they are?
		 */
		'charismaPrompt': (arg: { name: string }) => LocalizedString
		/**
		 * How wise they are?
		 */
		'wisdomPrompt': () => LocalizedString
		/**
		 * ℹ️
		 */
		'help': () => LocalizedString
		'charisma': {	
			/**
			 * 😩
			 */
			'0': () => LocalizedString
			/**
			 * 😕
			 */
			'1': () => LocalizedString
			/**
			 * 🤔
			 */
			'2': () => LocalizedString
			/**
			 * 🤩
			 */
			'3': () => LocalizedString
			/**
			 * 🔥
			 */
			'4': () => LocalizedString
		}
		'wisdom': {	
			/**
			 * 🤪
			 */
			'0': () => LocalizedString
			/**
			 * 🤥
			 */
			'1': () => LocalizedString
			/**
			 * 🤔
			 */
			'2': () => LocalizedString
			/**
			 * 🥸
			 */
			'3': () => LocalizedString
			/**
			 * 🦉
			 */
			'4': () => LocalizedString
		}
		/**
		 * Got it! Your scores will be applied soon
		 */
		'done': () => LocalizedString
	}
	'errors': {	
		'UpdateFinishedBrainstormError': () => LocalizedString
		'SelfVotingIdeaError': () => LocalizedString
		'DoubelVotingError': () => LocalizedString
		'UpdateFinishedIdeaError': () => LocalizedString
		'InvalidTimeProposal': () => LocalizedString
		'InvalidAcceptanceTime': () => LocalizedString
		'NotYourQuest': () => LocalizedString
		'IndeclinableError': () => LocalizedString
		'QuestIncompleteError': () => LocalizedString
		'NotParticipated': () => LocalizedString
		'VoteRangeError': () => LocalizedString
		'SelfVotingError': () => LocalizedString
		'ApplicationTransitionError': () => LocalizedString
		'NoChiefTribeError': () => LocalizedString
		'EntityNotFound': () => LocalizedString
		'NotYourTribe': () => LocalizedString
		'NoIdeaError': () => LocalizedString
		'AlreadyHaveChief': () => LocalizedString
		'ElderMismatchError': () => LocalizedString
		'WrongQuestError': () => LocalizedString
		/**
		 * 🤨 Hmm... this tribe has no chief.
		 */
		'NoChiefSetError': () => LocalizedString
		'NoShamanSetError': () => LocalizedString
		/**
		 * 🚫 Sorry, you cannot change application process now.
		 */
		'WrongPhaseError': () => LocalizedString
		'VotingNotStartedError': () => LocalizedString
		'ExternalMemberVoteError': () => LocalizedString
		'NotEnoughMembers': () => LocalizedString
		'NotAChiefError': () => LocalizedString
		/**
		 * 😩 Oooops! Something awfull happend.
		 */
		'common': () => LocalizedString
	}
}

export type Formatters = {
	'date': (value: Date) => unknown
}

type Param<P extends string> = `{${P}}`

type Params1<P1 extends string> =
	`${string}${Param<P1>}${string}`

type Params2<P1 extends string, P2 extends string> =
	`${string}${Param<P1>}${string}${Param<P2>}${string}`

type Params3<P1 extends string, P2 extends string, P3 extends string> =
	`${string}${Param<P1>}${string}${Param<P2>}${string}${Param<P3>}${string}`

type Params4<P1 extends string, P2 extends string, P3 extends string, P4 extends string> =
	`${string}${Param<P1>}${string}${Param<P2>}${string}${Param<P3>}${string}${Param<P4>}${string}`

type RequiredParams1<P1 extends string> =
	| Params1<P1>

type RequiredParams2<P1 extends string, P2 extends string> =
	| Params2<P1, P2>
	| Params2<P2, P1>

type RequiredParams3<P1 extends string, P2 extends string, P3 extends string> =
	| Params3<P1, P2, P3>
	| Params3<P1, P3, P2>
	| Params3<P2, P1, P3>
	| Params3<P2, P3, P1>
	| Params3<P3, P1, P2>
	| Params3<P3, P2, P1>

type RequiredParams4<P1 extends string, P2 extends string, P3 extends string, P4 extends string> =
	| Params4<P1, P2, P3, P4>
	| Params4<P1, P2, P4, P3>
	| Params4<P1, P3, P2, P4>
	| Params4<P1, P3, P4, P2>
	| Params4<P1, P4, P2, P3>
	| Params4<P1, P4, P3, P2>
	| Params4<P2, P1, P3, P4>
	| Params4<P2, P1, P4, P3>
	| Params4<P2, P3, P1, P4>
	| Params4<P2, P3, P4, P1>
	| Params4<P2, P4, P1, P3>
	| Params4<P2, P4, P3, P1>
	| Params4<P3, P1, P2, P4>
	| Params4<P3, P1, P4, P2>
	| Params4<P3, P2, P1, P4>
	| Params4<P3, P2, P4, P1>
	| Params4<P3, P4, P1, P2>
	| Params4<P3, P4, P2, P1>
	| Params4<P4, P1, P2, P3>
	| Params4<P4, P1, P3, P2>
	| Params4<P4, P2, P1, P3>
	| Params4<P4, P2, P3, P1>
	| Params4<P4, P3, P1, P2>
	| Params4<P4, P3, P2, P1>
