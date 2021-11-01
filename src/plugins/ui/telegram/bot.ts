// TODO don't forget to handle all exceptions:
//      - those with specifc class should be handled somewhere below
//      - genereic Errors will porpagate up to here and must be reported

import { Scenes, session, Telegraf } from 'telegraf'
import express from 'express'

import { startScreen } from './screens/start'
import { rulesScreen } from './screens/rules'
import { tribesListScreen } from './screens/tribes-list'
import { TribeApplication, TribeShow, TelegramUsers, Initiation } from './mocks'
import { TestNotificationBus } from '../../notification-bus'
import { attachNotifications } from './notifications'
import { initiationScreen } from './screens/initiation'
import { testLauncher } from './screens/test-launcher'

const token = process.env.BOT_KEY_TEST1
if (token === undefined) {
    throw new Error('BOT_TOKEN must be provided!')
}

const bot = new Telegraf<Scenes.SceneContext>(token)

const bus = new TestNotificationBus()
const telegramUsers = new TelegramUsers()
const tribalism = {
    tribesShow: new TribeShow(),
    tribeApplication: new TribeApplication(bus),
    initiation: new Initiation(bus),
}
bot.catch((err, ctx) => {
    console.error('============================')
    console.error(err)
    console.error('============================')
    ctx.reply(String(err))
})
bot.use(session())
bot.telegram.setWebhook('https://tribalizm-1.rblab.net/tg-hook')
bot.use(async (ctx, next) => {
    ctx.state.user = await telegramUsers.getUserByChatId(ctx.chat?.id)
    next()
})
startScreen(bot, telegramUsers)
rulesScreen(bot)
tribesListScreen(bot, tribalism, telegramUsers)
initiationScreen(bot, tribalism, telegramUsers)
attachNotifications(bot, bus, telegramUsers)
testLauncher(bot, telegramUsers)
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

const app = express()
app.use(express.json())

/** this one used to check server is running */
app.get('/ping', (req, res) => {
    console.log('ping recieved')
    res.end('pong')
})

app.use(bot.webhookCallback('/tg-hook'))

app.listen(3000)
