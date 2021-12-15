import express, { ErrorRequestHandler } from 'express'
import { MongoClient } from 'mongodb'
import { createMongoStores } from './mongo-context'
import { Logger } from './plugins/logger'
import { TestNotificationBus } from './plugins/notification-bus'
import { makeBot } from './plugins/ui/telegram/bot'
import { StoreTelegramUsersAdapter } from './plugins/ui/telegram/users-adapter'
import { makeTribalizm } from './use-cases/tribalism'
import { Scheduler } from './use-cases/utils/scheduler'
import { TaskDispatcher } from './use-cases/utils/task-dispatcher'
import promClient from 'prom-client'

async function getDb() {
    const { DB_USER, DB_HOST, DB_PASS } = process.env
    const url = `mongodb://${DB_USER}:${DB_PASS}@${[DB_HOST]}:27017`
    const client = new MongoClient(url, { useUnifiedTopology: true })
    try {
        await client.connect()

        const db = client.db(process.env.DB)
        await db.command({ ping: 1 })
        return { db, client }
    } catch (e) {
        await client.close()
        throw e
    }
}

async function main() {
    const logger = new Logger()
    const metricsRgistry = new promClient.Registry()
    metricsRgistry.setDefaultLabels({
        app: 'tribalzm-bot',
    })
    promClient.collectDefaultMetrics({ register: metricsRgistry })
    try {
        const { db, client } = await getDb()

        const stores = createMongoStores(db)

        const busErrorCounter = new promClient.Counter({
            name: 'tribalizm_notification_bus_errors_total',
            help: 'Caught errors, that happens when notifications were handled',
            labelNames: ['error'],
        })
        metricsRgistry.registerMetric(busErrorCounter)
        const notificationBus = new TestNotificationBus(logger, (err) => {
            busErrorCounter.inc({ error: String(err) })
        })

        const tribalizm = makeTribalizm({ stores, async: { notificationBus } })

        const tgUsersAdapter = new StoreTelegramUsersAdapter(
            stores.userStore,
            stores.tgUserStore,
            logger
        )

        const botErrorCounter = new promClient.Counter({
            name: 'tribalizm_bot_errors_total',
            help: 'Caught errors, reported by bot',
            labelNames: ['error'],
        })
        metricsRgistry.registerMetric(botErrorCounter)
        function countErrors(error: unknown) {
            botErrorCounter.inc({ error: String(error) })
        }
        const bot = await makeBot({
            logger,
            metrics: { countErrors },
            telegramUsersAdapter: tgUsersAdapter,
            messageStore: stores.messageStore,
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

        const httpRequestDurationMicroseconds = new promClient.Histogram({
            name: 'hook_handling_duration_seconds',
            help: 'Telegram hook handling duration (μs)',
            labelNames: ['type'],
            buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
        })
        metricsRgistry.registerMetric(httpRequestDurationMicroseconds)

        app.post('/tg-hook', async (req, res, next) => {
            const end = httpRequestDurationMicroseconds.startTimer()

            await bot.webhookCallback('/tg-hook')(req, res, next)

            // set labels for metric
            const message = req.body.message?.text
            if (message && String(message).startsWith('/')) {
                return end({ type: `command: ${message}` })
            }
            if (req.body.message && 'location' in req.body.message) {
                return end({ type: 'location' })
            }
            if (req.body.callback_query) {
                const callback = String(req.body.callback_query.data).split(
                    ':'
                )[0]
                return end({ type: `callback: ${callback}` })
            }
            end({ type: 'text or unknown' })
        })

        const queueCheckDurationMicroseconds = new promClient.Histogram({
            name: 'queue_check_duration_seconds',
            help: 'Handling of tasks queue duration (μs)',
            labelNames: ['tasks'],
            buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
        })
        metricsRgistry.registerMetric(queueCheckDurationMicroseconds)

        app.get('/check-queue', async (req, res) => {
            const end = queueCheckDurationMicroseconds.startTimer()
            const tasks = await taskDispatcher.run()
            end({ tasks })
            res.send('ok')
        })
        app.get('/metrics', async (req, res) => {
            res.setHeader('Content-Type', metricsRgistry.contentType)
            res.end(await metricsRgistry.metrics())
        })

        const globalErrorCounter = new promClient.Counter({
            name: 'tribalizm_express_errors_total',
            help: 'Caught errors, reported by express',
            labelNames: ['error'],
        })
        metricsRgistry.registerMetric(globalErrorCounter)

        const globalErrorHandler: ErrorRequestHandler = (
            error,
            _req,
            res,
            _next
        ) => {
            logger.error(error)
            globalErrorCounter.inc({ error: String(error) })
            res.status(500).send({
                code: 500,
                error: true,
                message: 'Internal server error',
            })
        }
        app.use(globalErrorHandler)

        logger.enableUnhandledRejectionsHandler()

        const server = app.listen(3000, async () => {
            await bot.telegram.setWebhook(
                `https://${process.env.DOMAIN}/tg-hook`
            )
            logger.trace('server started', { port: 3000 })
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
