import express from 'express'
import { makeBot } from './plugins/ui/telegram/bot'

const app = express()
app.use(express.json())

/** this one used to check server is running */
// TODO replace with smth form here: https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html
app.get('/ping', (req, res) => {
    console.log('ping recieved')
    res.end('pong')
})

makeBot({
    telegramUsersAdapter: null as any,
    webHook: {
        domain: 'tribalizm.rblab.net',
    },
    tribalism: null as any,
    token: process.env.BOT_TOKEN,
    notificationBus: null as any,
}).then((bot) => {
    app.use(bot.webhookCallback('/tg-hook'))

    app.listen(3000)
})
