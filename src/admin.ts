import { MongoClient } from 'mongodb'
import { createMongoStores } from './mongo-context'
import { Logger } from './plugins/logger'
import { TestNotificationBus } from './plugins/notification-bus'
import { runAdmin } from './plugins/ui/admin/run-admin'
import { noop } from './ts-utils'

async function main() {
    const { DB_USER, DB_HOST, DB_PASS } = process.env
    const url = `mongodb://${DB_USER}:${DB_PASS}@${[DB_HOST]}:27017`
    const client = new MongoClient(url, { useUnifiedTopology: true })
    try {
        await client.connect()

        const db = client.db(process.env.DB)
        await db.command({ ping: 1 })

        const stores = createMongoStores(db)

        const notificationBus = new TestNotificationBus(new Logger(), noop)

        await runAdmin(
            { stores, async: { notificationBus } },
            stores.tgUserStore
        )
    } finally {
        await client.close()
    }
}

main().catch((code) => {
    console.error(code)
    process.exit(code)
})
