import { ApplicationRequest } from '../../../use-cases/apply-tribe'
import { Application } from '../../../use-cases/entities/application'
import { ITribe, TribeType } from '../../../use-cases/entities/tribe'
import { TribesRequest } from '../../../use-cases/tribes-show'

const names = [
    [
        'id_1',
        'любители котиков',
        'Мы восхищаемся котиками и всеми, что с ними связано',
    ],
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
    [
        'id_4',
        'Энтузиасты электро транспорта',
        'Мы боримся за внедрение электро транспорта в СПБ',
    ],
    ['id_5', 'Less Wrong', 'Сообщество рационалистов'],
    ['id_6', 'Steam Punk', 'Настоящая паропанковская туса!'],
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
    appyToTribe = async (req: ApplicationRequest) => {
        const newMember = { id: '100500' }
        return {
            ...new Application({
                memberId: newMember.id,
                tribeId: req.tribeId,
                coverLetter: req.coverLetter,
                chiefId: 'tribe.chiefId',
                shamanId: 'tribe.shamanId',
            }),
            id: 'new-application',
        }
    }
}
