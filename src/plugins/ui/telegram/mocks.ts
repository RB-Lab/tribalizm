import {
    ApplicationMessage,
    ApplicationRequest,
} from '../../../use-cases/apply-tribe'
import { Storable } from '../../../use-cases/entities/store'
import { TribeType } from '../../../use-cases/entities/tribe'
import { User } from '../../../use-cases/entities/user'
import {
    ApplicationDeclined,
    ChiefApprovalRequest,
    DeclineRequest,
    InitiationRequest,
    ShamanApprovalRequest,
} from '../../../use-cases/initiation'
import { TribesRequest } from '../../../use-cases/tribes-show'
import { NotificationBus } from '../../../use-cases/utils/notification-bus'

let user: (User & Storable) | null = null
// TODO add to use-cases
export class TelegramUsers {
    createUser = async (
        name: string,
        providerData: {
            chatId: string
            locale?: string
            username?: string
        }
    ) => {
        user = {
            ...new User({
                name,
                provider: {
                    telegram: providerData,
                },
            }),
            id: 'mock-user',
        }
    }
    getUserByChatId = async (chatId: number | undefined) => {
        return user
    }
    getUserById = async (userId: string) => {
        return user
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
                elderUserId: user.id,
                tribeName: names.find(([id]) => id === req.tribeId)![1],
                applicationId: 'new-application-id',
                coverLetter: req.coverLetter,
                userName: user.name,
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
        this.bus.notify<ApplicationDeclined>({
            type: 'application-declined',
            payload: {
                targetUserId: user!.id,
                tribeName: 'Tribe you applied, you know...',
            },
        })
    }
}
