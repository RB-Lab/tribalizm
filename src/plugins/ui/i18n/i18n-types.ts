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
		 * Join tribes of likely-minded people nearby!
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
			'onBrainstorm': string
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
		 * To join a tribe you like you must send application. Tribe's chief and shaman will consider it and invite you to have a conversation with them. If they decide that you align with the tribe spirit well, they will let you join
		 */
		'apply': string
		/**
		 * Chief is the most charismatic person in the tribe. Their duties is to maintain tribe's integrity.
		 */
		'onChief': string
		/**
		 * Shaman is the most wise person in the tribe. Their duties is to assist tribe's chief.
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
		 * ☑️ Applied!
		 */
		'applicationSentShort': string
		/**
		 * Can't find your city, please type it's name.
		 */
		'cantFindCity': string
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
		 * Please describe in a few words why did you decline an application.
		 */
		'declinePrompt': string
		/**
		 * Ok, application has been declined
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
		 * Candidate for {tribe} tribe {name} proposes to meet: 
	 {proposal}
		 * @param {string} name
		 * @param {string} proposal
		 * @param {string} tribe
		 */
		'questNotificationForElder': RequiredParams3<'name', 'proposal', 'tribe'>
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
		'applicationApproved': RequiredParams1<'tribe'>
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
		 * {name} of the {tribe} proposes to meet to introduce themselves: 
	 {proposal}
		 * @param {unknown} name
		 * @param {string} proposal
		 * @param {string} tribe
		 */
		'questNotification': RequiredParams3<'name', 'proposal', 'tribe'>
	}
	'coordination': {	
		/**
		 * 💪 Yay! Le'ts do it!
		 */
		'okay': string
		/**
		 * You're going to coordinate efforts to incarnate your idea "{description}" with {name}. We need to arrange first meeting.
		 * @param {string} description
		 * @param {string} name
		 */
		'coordinateOwnIdea': RequiredParams2<'description', 'name'>
		/**
		 * {name} of the {tribe} proposes to meet to coordinate efforts for "{description}": 
	 {proposal}
		 * @param {string} description
		 * @param {unknown} name
		 * @param {string} proposal
		 * @param {string} tribe
		 */
		'questNotification': RequiredParams4<'description', 'name', 'proposal', 'tribe'>
		/**
		 * New quest "{description}" assigned to you and {name}. Let's arrange a meeting!
		 * @param {string} description
		 * @param {string} name
		 */
		'coordinateSpawned': RequiredParams2<'description', 'name'>
		/**
		 * When discuss with {name}, you can:
		 * @param {string} name
		 */
		'questManage': RequiredParams1<'name'>
		/**
		 * Describe the quest, please
		 */
		'spawnDescribe': string
		/**
		 * Describe the reason for gathering
		 */
		'gatheringDescribe': string
		/**
		 * When do you want to gather?
		 */
		'gatheringWhen': string
		/**
		 * Where you'd like to met?
		 */
		'gatheringSetPlace': string
		/**
		 * 👌 Ok, quest assigned
		 */
		'questAssigned': string
		'what': {	
			/**
			 * tribe
			 */
			'all': string
			/**
			 * all interested members
			 */
			'upvoters': string
		}
		/**
		 * Gather {what} for "{description}" at: 
	 {proposal}
		 * @param {string} description
		 * @param {string} proposal
		 * @param {string} what
		 */
		'confirmPrompt': RequiredParams3<'description', 'proposal', 'what'>
		/**
		 *  • Time: {date|date}
	 • Place: {place}
		 * @param {Date} date
		 * @param {unknown} place
		 */
		'proposal': RequiredParams2<'date|date', 'place'>
		/**
		 * ✅ Yes
		 */
		'confirm': string
		/**
		 * 🤔 Change
		 */
		'edit': string
		/**
		 * Ok, I proclaim the gathering!
		 */
		'gatheringDone': string
		'buttons': {	
			/**
			 * Create a sub-quest
			 */
			'spawn': string
			/**
			 * Gather idea supporters
			 */
			'gatherUpwoters': string
			/**
			 * Gather whole tribe
			 */
			'gatherTribe': string
			/**
			 * Meet one more time
			 */
			'reQuest': string
		}
	}
	'gathering': {	
		/**
		 * New gathering for "{reason}": 
	 {proposal}
		 * @param {string} proposal
		 * @param {string} reason
		 */
		'declared': RequiredParams2<'proposal', 'reason'>
		/**
		 *  • Time: {date|date}
	 • Place: {place}
		 * @param {Date} date
		 * @param {unknown} place
		 */
		'proposal': RequiredParams2<'date|date', 'place'>
		/**
		 * Acknowledge
		 */
		'accept': string
		/**
		 * Decline
		 */
		'decline': string
		/**
		 * ☺️ Cool! See ya there!
		 */
		'accepted': string
		/**
		 * 🥺 Ahh, that's a pity...
		 */
		'declined': string
		/**
		 * How was the gathering?
		 */
		'ratePrompt': string
		'rates': {	
			/**
			 * 😩
			 */
			'0': string
			/**
			 * 😒
			 */
			'1': string
			/**
			 * 😐
			 */
			'2': string
			/**
			 * 😌
			 */
			'3': string
			/**
			 * 🥰
			 */
			'4': string
		}
		/**
		 * Ok, gathering coordinators have been properly acknowledged
		 */
		'rateDone': string
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
		/**
		 * 🕘 Choose an hour of the day
		 */
		'proposeTimeHours': string
		/**
		 * 🕤 Choose minutes
		 */
		'proposeTimeMinutes': string
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
		 * All participants agreed to meet for "{description}" at: 
	 {proposal}
		 * @param {string} description
		 * @param {string} proposal
		 */
		'questAccepted': RequiredParams2<'description', 'proposal'>
		/**
		 * {who} agreed to meet at: 
	 {proposal}
		 * @param {string} proposal
		 * @param {string} who
		 */
		'questAcceptedPersonal': RequiredParams2<'proposal', 'who'>
	}
	'notifications': {	
		'tribeApplication': {	
			/**
			 * A new member application for tribe {tribe}!
			 * @param {unknown} tribe
			 */
			'title': RequiredParams1<'tribe'>
			/**
			 * From user {username}.
			 * @param {unknown} username
			 */
			'applicant': RequiredParams1<'username'>
			/**
			 * Cover letter:
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
			 * Your application to the tribe "{tribe}" has been declined
			 * @param {unknown} tribe
			 */
			'applicationDeclined': RequiredParams1<'tribe'>
		}
	}
	'rateMember': {	
		/**
		 * You've just meet {tribe} {elder}, how charismatic they are?
		 * @param {string} elder
		 * @param {string} tribe
		 */
		'elderCharismaPrompt': RequiredParams2<'elder', 'tribe'>
		/**
		 * You've just meet {name}, how charismatic they are?
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
	'brainstorm': {	
		/**
		 * ⛈ It's Time To STORM!!!
		 */
		'timeToStorm': string
		/**
		 * ⚡️⚡️ Let's start it ⚡️⚡️
		 */
		'toStormButton': string
		/**
		 * 📅 Select a date, when to start brainstorm
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
		 * Start brainstorm at {date|date}?
		 * @param {Date} date
		 */
		'confirmPrompt': RequiredParams1<'date|date'>
		/**
		 * ✅ Okay
		 */
		'confirm': string
		/**
		 * 🤔 Edit
		 */
		'edit': string
		/**
		 * ⛈ Ok. I'll arrange brainstorm ⛈
		 */
		'done': string
		/**
		 * ⛈ New brainstorm is coming on {date|date} ⛈
		 * @param {Date} date
		 */
		'brainstormDeclared': RequiredParams1<'date|date'>
		/**
		 * ⛈ There is a brainstorm on the horizon: {date|date}! ⛈
		 * @param {Date} date
		 */
		'brainstormNotice': RequiredParams1<'date|date'>
		/**
		 * Brainstorm started! Propose your ideas! 💥
		 */
		'started': string
		/**
		 * Brainstorm is over, it's time to vote for ideas!
		 */
		'toVote': string
		/**
		 * Storm ended! Most popular ideas are to be incarnated.
		 */
		'end': string
	}
	'errors': {	
		'UpdateFinishedBrainstormError': string
		'SelfVotingIdeaError': string
		'DoubleVotingError': string
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
		/**
		 * 🚫 Sorry, you cannot start a brainstorm, only tribe chief can
		 */
		'NotAChiefError': string
		/**
		 * 🤬 System error! Cannot finalize storm before voting
		 */
		'FinalyzeBeforeVotingError': string
		/**
		 * 🤬 System error! Cannot add idea: brainstorm is not raging
		 */
		'StormNotStarted': string
		/**
		 * 😩 Oops! Something awfully happened.
		 */
		'common': string
		/**
		 * 🚫 This quest is already over
		 */
		'QuestFinishedError': string
	}
}

export type TranslationFunctions = {
	'start': {	
		/**
		 * Join tribes of likely-minded people nearby!
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
			'onBrainstorm': () => LocalizedString
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
		 * To join a tribe you like you must send application. Tribe's chief and shaman will consider it and invite you to have a conversation with them. If they decide that you align with the tribe spirit well, they will let you join
		 */
		'apply': () => LocalizedString
		/**
		 * Chief is the most charismatic person in the tribe. Their duties is to maintain tribe's integrity.
		 */
		'onChief': () => LocalizedString
		/**
		 * Shaman is the most wise person in the tribe. Their duties is to assist tribe's chief.
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
		 * ☑️ Applied!
		 */
		'applicationSentShort': () => LocalizedString
		/**
		 * Can't find your city, please type it's name.
		 */
		'cantFindCity': () => LocalizedString
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
		 * Please describe in a few words why did you decline an application.
		 */
		'declinePrompt': () => LocalizedString
		/**
		 * Ok, application has been declined
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
		 * Candidate for {tribe} tribe {name} proposes to meet: 
	 {proposal}
		 */
		'questNotificationForElder': (arg: { name: string, proposal: string, tribe: string }) => LocalizedString
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
		'applicationApproved': (arg: { tribe: string }) => LocalizedString
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
		 * {name} of the {tribe} proposes to meet to introduce themselves: 
	 {proposal}
		 */
		'questNotification': (arg: { name: unknown, proposal: string, tribe: string }) => LocalizedString
	}
	'coordination': {	
		/**
		 * 💪 Yay! Le'ts do it!
		 */
		'okay': () => LocalizedString
		/**
		 * You're going to coordinate efforts to incarnate your idea "{description}" with {name}. We need to arrange first meeting.
		 */
		'coordinateOwnIdea': (arg: { description: string, name: string }) => LocalizedString
		/**
		 * {name} of the {tribe} proposes to meet to coordinate efforts for "{description}": 
	 {proposal}
		 */
		'questNotification': (arg: { description: string, name: unknown, proposal: string, tribe: string }) => LocalizedString
		/**
		 * New quest "{description}" assigned to you and {name}. Let's arrange a meeting!
		 */
		'coordinateSpawned': (arg: { description: string, name: string }) => LocalizedString
		/**
		 * When discuss with {name}, you can:
		 */
		'questManage': (arg: { name: string }) => LocalizedString
		/**
		 * Describe the quest, please
		 */
		'spawnDescribe': () => LocalizedString
		/**
		 * Describe the reason for gathering
		 */
		'gatheringDescribe': () => LocalizedString
		/**
		 * When do you want to gather?
		 */
		'gatheringWhen': () => LocalizedString
		/**
		 * Where you'd like to met?
		 */
		'gatheringSetPlace': () => LocalizedString
		/**
		 * 👌 Ok, quest assigned
		 */
		'questAssigned': () => LocalizedString
		'what': {	
			/**
			 * tribe
			 */
			'all': () => LocalizedString
			/**
			 * all interested members
			 */
			'upvoters': () => LocalizedString
		}
		/**
		 * Gather {what} for "{description}" at: 
	 {proposal}
		 */
		'confirmPrompt': (arg: { description: string, proposal: string, what: string }) => LocalizedString
		/**
		 *  • Time: {date|date}
	 • Place: {place}
		 */
		'proposal': (arg: { date: Date, place: unknown }) => LocalizedString
		/**
		 * ✅ Yes
		 */
		'confirm': () => LocalizedString
		/**
		 * 🤔 Change
		 */
		'edit': () => LocalizedString
		/**
		 * Ok, I proclaim the gathering!
		 */
		'gatheringDone': () => LocalizedString
		'buttons': {	
			/**
			 * Create a sub-quest
			 */
			'spawn': () => LocalizedString
			/**
			 * Gather idea supporters
			 */
			'gatherUpwoters': () => LocalizedString
			/**
			 * Gather whole tribe
			 */
			'gatherTribe': () => LocalizedString
			/**
			 * Meet one more time
			 */
			'reQuest': () => LocalizedString
		}
	}
	'gathering': {	
		/**
		 * New gathering for "{reason}": 
	 {proposal}
		 */
		'declared': (arg: { proposal: string, reason: string }) => LocalizedString
		/**
		 *  • Time: {date|date}
	 • Place: {place}
		 */
		'proposal': (arg: { date: Date, place: unknown }) => LocalizedString
		/**
		 * Acknowledge
		 */
		'accept': () => LocalizedString
		/**
		 * Decline
		 */
		'decline': () => LocalizedString
		/**
		 * ☺️ Cool! See ya there!
		 */
		'accepted': () => LocalizedString
		/**
		 * 🥺 Ahh, that's a pity...
		 */
		'declined': () => LocalizedString
		/**
		 * How was the gathering?
		 */
		'ratePrompt': () => LocalizedString
		'rates': {	
			/**
			 * 😩
			 */
			'0': () => LocalizedString
			/**
			 * 😒
			 */
			'1': () => LocalizedString
			/**
			 * 😐
			 */
			'2': () => LocalizedString
			/**
			 * 😌
			 */
			'3': () => LocalizedString
			/**
			 * 🥰
			 */
			'4': () => LocalizedString
		}
		/**
		 * Ok, gathering coordinators have been properly acknowledged
		 */
		'rateDone': () => LocalizedString
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
		/**
		 * 🕘 Choose an hour of the day
		 */
		'proposeTimeHours': () => LocalizedString
		/**
		 * 🕤 Choose minutes
		 */
		'proposeTimeMinutes': () => LocalizedString
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
		 * All participants agreed to meet for "{description}" at: 
	 {proposal}
		 */
		'questAccepted': (arg: { description: string, proposal: string }) => LocalizedString
		/**
		 * {who} agreed to meet at: 
	 {proposal}
		 */
		'questAcceptedPersonal': (arg: { proposal: string, who: string }) => LocalizedString
	}
	'notifications': {	
		'tribeApplication': {	
			/**
			 * A new member application for tribe {tribe}!
			 */
			'title': (arg: { tribe: unknown }) => LocalizedString
			/**
			 * From user {username}.
			 */
			'applicant': (arg: { username: unknown }) => LocalizedString
			/**
			 * Cover letter:
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
			 * Your application to the tribe "{tribe}" has been declined
			 */
			'applicationDeclined': (arg: { tribe: unknown }) => LocalizedString
		}
	}
	'rateMember': {	
		/**
		 * You've just meet {tribe} {elder}, how charismatic they are?
		 */
		'elderCharismaPrompt': (arg: { elder: string, tribe: string }) => LocalizedString
		/**
		 * You've just meet {name}, how charismatic they are?
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
	'brainstorm': {	
		/**
		 * ⛈ It's Time To STORM!!!
		 */
		'timeToStorm': () => LocalizedString
		/**
		 * ⚡️⚡️ Let's start it ⚡️⚡️
		 */
		'toStormButton': () => LocalizedString
		/**
		 * 📅 Select a date, when to start brainstorm
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
		 * Start brainstorm at {date|date}?
		 */
		'confirmPrompt': (arg: { date: Date }) => LocalizedString
		/**
		 * ✅ Okay
		 */
		'confirm': () => LocalizedString
		/**
		 * 🤔 Edit
		 */
		'edit': () => LocalizedString
		/**
		 * ⛈ Ok. I'll arrange brainstorm ⛈
		 */
		'done': () => LocalizedString
		/**
		 * ⛈ New brainstorm is coming on {date|date} ⛈
		 */
		'brainstormDeclared': (arg: { date: Date }) => LocalizedString
		/**
		 * ⛈ There is a brainstorm on the horizon: {date|date}! ⛈
		 */
		'brainstormNotice': (arg: { date: Date }) => LocalizedString
		/**
		 * Brainstorm started! Propose your ideas! 💥
		 */
		'started': () => LocalizedString
		/**
		 * Brainstorm is over, it's time to vote for ideas!
		 */
		'toVote': () => LocalizedString
		/**
		 * Storm ended! Most popular ideas are to be incarnated.
		 */
		'end': () => LocalizedString
	}
	'errors': {	
		'UpdateFinishedBrainstormError': () => LocalizedString
		'SelfVotingIdeaError': () => LocalizedString
		'DoubleVotingError': () => LocalizedString
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
		/**
		 * 🚫 Sorry, you cannot start a brainstorm, only tribe chief can
		 */
		'NotAChiefError': () => LocalizedString
		/**
		 * 🤬 System error! Cannot finalize storm before voting
		 */
		'FinalyzeBeforeVotingError': () => LocalizedString
		/**
		 * 🤬 System error! Cannot add idea: brainstorm is not raging
		 */
		'StormNotStarted': () => LocalizedString
		/**
		 * 😩 Oops! Something awfully happened.
		 */
		'common': () => LocalizedString
		/**
		 * 🚫 This quest is already over
		 */
		'QuestFinishedError': () => LocalizedString
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
