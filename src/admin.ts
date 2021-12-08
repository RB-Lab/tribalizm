import { MongoClient } from 'mongodb'
import { createMongoContext, createMongoTelegramContext } from './mongo-context'
import { Logger } from './plugins/logger'
import { TestNotificationBus } from './plugins/notification-bus'
import { runAdmin } from './plugins/ui/admin/run-admin'

async function main() {
    const { DB_USER, DB_HOST, DB_PASS } = process.env
    const url = `mongodb://${DB_USER}:${DB_PASS}@${[DB_HOST]}:27017`
    const client = new MongoClient(url, { useUnifiedTopology: true })
    try {
        await client.connect()

        const db = client.db('tribalizm')
        await db.command({ ping: 1 })

        const stores = createMongoContext(db)

        const { tgUserStore } = createMongoTelegramContext(db, stores.userStore)
        const notificationBus = new TestNotificationBus(new Logger())

        await runAdmin({ stores, async: { notificationBus } }, tgUserStore)
    } finally {
        await client.close()
    }
}

main().catch((code) => {
    console.error(code)
    process.exit(code)
})
