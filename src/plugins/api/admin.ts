import { Express } from 'express'
import { Maybe } from '../../ts-utils'
import { Tribalizm } from '../../use-cases/tribalism'
import { ViewModels } from '../../view-models/view-models'
export function adminApi(
    tribalism: Tribalizm,
    viewModels: ViewModels,
    app: Express
) {
    const routes = {
        declareBrainstorm: '/api/admin/brainstorm/declare',
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

    return routes
}

function getTimeDiff(timeZone: Maybe<string>, date: Date) {
    if (!timeZone) return 0
    const userTimeString = date.toLocaleString('en-US', {
        timeZone: timeZone,
    })

    return Date.parse(userTimeString) - date.getTime()
}
