// TODO don't forget to handle all exceptions:
//      - those with specifc class should be handled somewhere below
//      - genereic Errors will porpagate up to here and must be reported

import https from 'https'
import express from 'express'

const app = express()
app.use(express.json())

interface TgUpdate {
    update_id: number
    message: {
        message_id: number
        from: {
            id: number
            is_bot: boolean
            first_name: string
            last_name: string
            username: string
            language_code: 'en' | 'ru'
        }
        chat: {
            id: number
            first_name: string
            last_name: string
            username: string
            type: 'private'
        }
        date: number
        text: string
    }
}

interface TgMessageResult {
    ok: boolean
    result: {
        message_id: number
        from: {
            id: number
            is_bot: boolean
            first_name: string
            username: string
        }
        chat: {
            id: number
            first_name: string
            last_name: string
            username: string
            type: string
        }
        date: number
        text: string
        entities: [any]
    }
}

app.get('/ping', (req, res) => {
    console.log('ping')
    res.end('pong')
})
app.post('/tg-hook', (req, res) => {
    const update = req.body as TgUpdate
    console.log(
        `got hook, text is "${update.message.text}", message id: ${update.message.message_id}`
    )
    const reply = `Hello, ${update.message.from.first_name} ${
        update.message.from.last_name + ''
    }! You said <b>${update.message.text}</b> `
    const url = `https://api.telegram.org/bot${
        process.env.BOT_KEY_TEST1 + ''
    }/sendmessage?chat_id=${
        update.message.chat.id
    }&text=${reply}&parse_mode=HTML`
    https.get(url, (res) => {
        console.log('request done')
        let data = ''
        res.on('data', (d) => {
            data += d
        })
        res.on('end', () => {
            const result = JSON.parse(data) as TgMessageResult
            console.log('reply id:', result.result.message_id)
            console.log(result.result.entities)
        })
    })
    res.end('OK')
})

app.listen(3000)
