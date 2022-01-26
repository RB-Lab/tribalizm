import { table } from 'table'
import { Express } from 'express'
import { mapify, Maybe } from '../../ts-utils'
import { Tribalizm } from '../../use-cases/tribalism'
import { ViewModels } from '../../view-models/view-models'
import { TelegramUsersAdapter } from '../ui/telegram/users-adapter'
export function adminApi(
    tribalism: Tribalizm,
    viewModels: ViewModels,
    telegramUsersAdapter: TelegramUsersAdapter,
    app: Express
) {
    const routes = {
        declareBrainstorm: '/api/admin/brainstorm/declare',
        getUsersAndTribes: '/api/admin/analytics/users-and-tribes',
    }
    app.post(routes.declareBrainstorm, async (req, res) => {
        const tribeId: string = req.body.tribeId
        const time = new Date(req.body.time).getTime()
        const tribeInfo = await viewModels.tribe.getTribeInfo(tribeId)
        const diff = getTimeDiff(tribeInfo.city?.timeZone, new Date(time))

        await tribalism.brainstormLifecycle.declare({
            time: new Date(time - diff).getTime(),
            tribeId,
        })
        res.json({ result: 'ok' })
    })

    // GET http://localhost:3000/api/admin/analytics/users-and-tribes
    app.get(routes.getUsersAndTribes, async (req, res) => {
        const tgUsers = await telegramUsersAdapter.listTelegramUsers()
        const users = mapify(
            await viewModels.user.getUserInfoList(
                tgUsers.map((tu) => tu.userId)
            )
        )
        const views = tgUsers.map((tgu) => {
            const user = users[tgu.userId]
            return [
                user.id,
                tgu.tgUserName || user.name,
                user.tribes
                    .map(
                        (t) =>
                            `[${t.id}] ${t.name} (${t.city?.name || 'Astral'})`
                    )
                    .join(', \n'),
            ]
        })
        res.send(table(views))
    })

    return routes
}

function getTimeDiff(timeZone: Maybe<string>, date: Date) {
    if (!timeZone) return 0
    const userTimeString = date.toLocaleString('en-US', {
        timeZone: timeZone,
    })

    return Date.parse(userTimeString) - date.getTime()
}
