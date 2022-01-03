import winston, { format } from 'winston'
import { Console } from 'winston/lib/winston/transports'
import { EventMeta, ILogger } from '../use-cases/utils/logger'
import Transport from 'winston-transport'

export interface LoggerOptions {
    transport?: new () => Transport
}
enum LogLevels {
    error = 'error',
    warning = 'warning',
    trace = 'trace',
}
/**
 * **Environment:**
 * when NODE_ENV === 'production' all events end errors are logged,
 * [all traces and warnings logged only on errors] -- to be implemented
 * when NODE_ENV === 'test' nothing is logged unless log level implicitly set
 * via LOG_LEVEL (error|warning|trace) and/or LOG_EVENTS=true
 * when no NODE_ENV is not set (aka development) it logs everything
 *
 * When NODE_ENV === 'production' log format is JSON, otherwise – plain strings
 */
export class Logger implements ILogger {
    private debugLogger: winston.Logger
    private eventLogger: winston.Logger
    constructor(options: LoggerOptions = {}) {
        let debugLevel: string = LogLevels.trace
        let logEvents = process.env.NODE_ENV !== 'test'
        const timeStamp = format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        })
        const debugFormat = [timeStamp, format.errors({ stack: true })]
        const eventFormat = [timeStamp]
        if (process.env.NODE_ENV === 'test') {
            debugLevel = 'none'
            logEvents = process.env.LOG_EVENTS === 'true'
        }
        if (process.env.NODE_ENV === 'production') {
            debugLevel = LogLevels.error
            debugFormat.push(format.json())
            eventFormat.push(format.json())
        } else {
            debugFormat.push(txtFormat)
            eventFormat.push(txtFormat)
        }
        if (process.env.LOG_LEVEL) {
            debugLevel = process.env.LOG_LEVEL
        }

        const debugTransport = options.transport
            ? new options.transport()
            : new Console()
        const eventTransport = options.transport
            ? new options.transport()
            : new Console()

        this.debugLogger = winston.createLogger({
            level: debugLevel,
            levels: {
                [LogLevels.error]: 0,
                [LogLevels.warning]: 1,
                [LogLevels.trace]: 2,
            },
            transports: [debugTransport],

            format: format.combine(...debugFormat),
        })

        this.eventLogger = winston.createLogger({
            levels: { event: 0 },
            level: logEvents ? 'event' : 'none',
            transports: [eventTransport],
            format: format.combine(...eventFormat),
        })
    }
    error = async (error: unknown) => {
        this.debugLogger.log('error', error)
    }
    warn = async (message: any, ...rest: any[]) => {
        this.debugLogger.log('warning', String(message), ...rest)
    }
    trace = async (message: any, ...args: any[]) => {
        this.debugLogger.log('trace', String(message), ...args)
    }
    event = async (event: string, meta?: EventMeta) => {
        this.eventLogger.log('event', event, meta)
    }
    enableUnhandledRejectionsHandler = () => {
        ;(this.debugLogger as any).rejections.handle(
            this.debugLogger.transports
        )
    }
}

const txtFormat = format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length
        ? `, meta: {${formatObject(meta)}}`
        : ''
    return `${timestamp} - ${level.toLocaleUpperCase()}: ${message}${metaStr}`
})
function formatObject(obj: object) {
    return Object.entries(obj)
        .map(([key, value]) => `${key}: ${formatValue(value)}`)
        .join(', ')
}
function formatValue(value: any): string {
    if (!value) {
        if (value === undefined) {
            return '??'
        }
        if (value === 'null') {
            return 'nil'
        }
        if (value === '') {
            return `''`
        }
        return String(value)
    }
    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            return `[${value.map(formatValue).join(', ')}]`
        }
        if (value instanceof Date) {
            const yy = value.getFullYear().toString().slice(1)
            const dd = String(value.getDate()).padStart(2, '0')
            const mm = String(value.getMonth()).padStart(2, '0')
            const h = String(value.getHours()).padStart(2, '0')
            const m = String(value.getMinutes()).padStart(2, '0')
            const s = String(value.getSeconds()).padStart(2, '0')
            const ms = String(value.getMilliseconds()).padStart(2, '0')
            return `${dd}.${mm}.${yy} ${h}:${m}:${s}.${ms}`
        }
        return formatObject(value)
    }
    return String(value)
}
