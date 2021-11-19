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
		 * {name}, {elder} of the {tribe} proposes to meet: 
	 {proposal}
		 * @param {unknown} elder
		 * @param {unknown} name
		 * @param {unknown} proposal
		 * @param {unknown} tribe
		 */
		'questNotification': RequiredParams4<'elder', 'name', 'proposal', 'tribe'>
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
		/**
		 * candidate
		 */
		'candidate': string
	}
	'introduction': {	
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
		 * {name}, {elder} of the {tribe} proposes to meet: 
	 {proposal}
		 */
		'questNotification': (arg: { elder: unknown, name: unknown, proposal: unknown, tribe: unknown }) => LocalizedString
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
		/**
		 * candidate
		 */
		'candidate': () => LocalizedString
	}
	'introduction': {	
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
