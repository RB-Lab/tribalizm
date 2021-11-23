import {
    ApplicationMessage,
    ApplicationRequest,
} from '../../../use-cases/apply-tribe'
import { TribeType } from '../../../use-cases/entities/tribe'
import {
    ApplicationDeclinedMessage,
    ChiefApprovalRequest,
    DeclineRequest,
    InitiationRequest,
    ShamanApprovalRequest,
} from '../../../use-cases/initiation'
import { TribesRequest } from '../../../use-cases/tribes-show'
import { NotificationBus } from '../../../use-cases/utils/notification-bus'
import { TestNotificationBus } from '../../notification-bus'
import { makeBot } from './bot'
import { testLauncher } from './screens/test-launcher'
import { TelegramUsersAdapter } from './users-adapter'

interface ChatData {
    chatId: string
    locale?: string
    username?: string
}
let user: (ChatData & { id: string }) | null = null

class MockTelegramUsersAdapter implements TelegramUsersAdapter {
    createUser = async (name: string, providerData: ChatData) => {
        user = { ...providerData, username: name, id: 'mock-user' }
        return 'mock-user'
    }
    getUserIdByChatId = async (chatId: number | string) => {
        return user!.id
    }
    getChatDataByUserId = async (userId: string) => {
        if (!user) {
            throw new Error(`User ${userId} does not use telegram`)
        }
        return {
            chatId: user.chatId,
            locale: user.locale || 'en',
        }
    }
}

const names = [
    [
        'id_2',
        'Lex Fridman podcast descussion',
        'Here we discuss Lex fridman podcast and related stuff',
    ],
    [
        'id_3',
        'Открытый космос СПБ',
        'Группа поддержки открытого космоса в Санкт_Петербурге',
    ],
    ['id_5', 'Less Wrong', 'Сообщество рационалистов'],
]

export class TribeShow {
    getTribeInfo = async (req: { tribeId: string }) => {
        const tribe = names.find(([id]) => id === req.tribeId)
        if (!tribe) {
            throw new Error(`Tribe not found ${req.tribeId}`)
        }
        return {
            id: tribe[0],
            name: tribe[1],
            description: tribe[2],
            type: TribeType.tribe,
            membersCount: Math.round(Math.random() * 50),
        }
    }
    getLocalTribes = async (req: TribesRequest) => {
        return names.map(([id, name, description]) => ({
            id: id,
            name: name,
            description: description,
            type: TribeType.tribe,
            membersCount: Math.round(Math.random() * 50),
        }))
    }
}

export class TribeApplication {
    private bus: NotificationBus
    constructor(bus: NotificationBus) {
        this.bus = bus
    }
    appyToTribe = async (req: ApplicationRequest) => {
        if (!user) {
            throw new Error('User is not set')
        }
        this.bus.notify<ApplicationMessage>({
            type: 'application-message',
            payload: {
                questId: '--todo--',
                targetUserId: user.id,
                targetMemberId: '--todo--',
                tribeName: names.find(([id]) => id === req.tribeId)![1],
                coverLetter: req.coverLetter,
                userName: user.username!,
                elder: 'chief',
            },
        })
    }
}

export class Initiation {
    private bus: NotificationBus
    constructor(bus: NotificationBus) {
        this.bus = bus
    }
    startInitiation = async (req: InitiationRequest) => {
        console.log(req)
    }
    approveByChief = async (req: ChiefApprovalRequest) => {}
    startShamanInitiation = async (req: InitiationRequest) => {}
    approveByShaman = async (req: ShamanApprovalRequest) => {}
    decline = async (req: DeclineRequest) => {
        this.bus.notify<ApplicationDeclinedMessage>({
            type: 'application-declined',
            payload: {
                targetUserId: user!.id,
                tribeName: 'Tribe you applied, you know...',
            },
        })
    }
}

const token = process.env.BOT_KEY_TEST1

const notifcationsBus = new TestNotificationBus()
const telegramUsersAdapter = new MockTelegramUsersAdapter()
const tribalism = {
    tribesShow: new TribeShow(),
    tribeApplication: new TribeApplication(notifcationsBus),
    initiation: new Initiation(notifcationsBus),
}
makeBot({
    telegramUsersAdapter,
    webHook: {
        path: '/tg-hook',
        port: 3000,
        domain: 'tribalizm-1.rblab.net',
    },
    tribalism: tribalism as any,
    token,
    notifcationsBus,
}).then((bot) => {
    testLauncher(bot, telegramUsersAdapter)
})
