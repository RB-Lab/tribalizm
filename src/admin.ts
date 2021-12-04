import { MongoClient } from 'mongodb'
import { createMongoContext, createMongoTelegramContext } from './mongo-context'
import { runAdmin } from './plugins/ui/admin/run-admin'
import { Context } from './use-cases/utils/context'

async function main() {
    const url = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@mongodb:27017`
    const client = new MongoClient(url, { useUnifiedTopology: true })
    try {
        await client.connect()

        const db = client.db('tribalizm')
        await db.command({ ping: 1 })

        const context: Context = createMongoContext(db)

        const { tgUserStore } = createMongoTelegramContext(
            db,
            context.stores.userStore
        )

        await runAdmin(context, tgUserStore)
    } finally {
        await client.close()
    }
}

main().catch((code) => {
    console.error(code)
    process.exit(code)
})
