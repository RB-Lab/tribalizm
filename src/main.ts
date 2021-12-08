import express, { ErrorRequestHandler } from 'express'
import { MongoClient } from 'mongodb'
import { createMongoContext, createMongoTelegramContext } from './mongo-context'
import { Logger } from './plugins/logger'
import { TestNotificationBus } from './plugins/notification-bus'
import { makeBot } from './plugins/ui/telegram/bot'
import { makeTribalizm } from './use-cases/tribalism'
import { Scheduler } from './use-cases/utils/scheduler'
import { TaskDispatcher } from './use-cases/utils/task-dispatcher'

async function getDb() {
    const { DB_USER, DB_HOST, DB_PASS } = process.env
    const url = `mongodb://${DB_USER}:${DB_PASS}@${[DB_HOST]}:27017`
    const client = new MongoClient(url, { useUnifiedTopology: true })
    try {
        await client.connect()

        const db = client.db('tribalizm')
        await db.command({ ping: 1 })
        return { db, client }
    } catch (e) {
        await client.close()
        throw e
    }
}

async function main() {
    const logger = new Logger()
    try {
        const { db, client } = await getDb()

        const stores = createMongoContext(db)
        const notificationBus = new TestNotificationBus(logger)

        const { tgUsersAdapter, messageStore } = createMongoTelegramContext(
            db,
            stores.userStore
        )

        const tribalizm = makeTribalizm({ stores, async: { notificationBus } })

        const bot = await makeBot({
            logger,
            telegramUsersAdapter: tgUsersAdapter,
            messageStore: messageStore,
            tribalizm: tribalizm,
            token: process.env.BOT_TOKEN,
            notificationBus: notificationBus,
        })

        const scheduler = new Scheduler(stores.taskStore)
        const taskDispatcher = new TaskDispatcher(tribalizm, scheduler, logger)

        const app = express()
        app.use(express.json())

        /** this one used to check server is running */
        // TODO replace with something form here:
        //      https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html
        app.get('/ping', (req, res) => {
            console.log('ping received')
            res.end('pong')
        })
        app.use(bot.webhookCallback('/tg-hook'))
        app.get('/check-queue', async (req, res) => {
            await taskDispatcher.run()
            res.send('ok')
        })

        const globalErrorHandler: ErrorRequestHandler = (
            error,
            _req,
            res,
            _next
        ) => {
            logger.error(error)
            res.status(500).send({
                code: 500,
                error: true,
                message: 'Internal server error',
            })
        }
        app.use(globalErrorHandler)
        logger.enableUnhandledRejectionsHandler()

        const server = app.listen(3000, () => {
            logger.trace('server started', { port: 3000 })
            bot.telegram.setWebhook('https://tribalizm-1.rblab.net/tg-hook')
        })

        process.once('SIGINT', stop)
        process.once('SIGTERM', stop)
        async function stop() {
            server.close()
            await client.close()
        }
    } catch (e) {
        logger.error(e)
    }
}
main().catch((e) => {
    console.error(e)
    process.exit(1)
})
