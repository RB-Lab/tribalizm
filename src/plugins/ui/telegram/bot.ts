// TODO don't forget to handle all exceptions:
//      - those with specifc class should be handled somewhere below
//      - genereic Errors will porpagate up to here and must be reported

import {Telegraf} from 'telegraf'
import express from 'express'

import { startScreen } from './screens/start'
import { rulesScreen } from './screens/rules'
import { tribesListScreen } from './screens/tribes-list'


const token = process.env.BOT_KEY_TEST1
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

const bot =  new Telegraf(token)

bot.telegram.setWebhook('https://tribalizm-1.rblab.net/tg-hook')
startScreen(bot)
rulesScreen(bot)
tribesListScreen(bot)

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))


const app = express()
app.use(express.json())

/** this one used to check server is running */
app.get('/ping', (req, res) => {
    console.log('ping recieved')
    res.end('pong - wtf')
})

app.use(bot.webhookCallback('/tg-hook'))


app.listen(3000)
