import { Logger } from './logger'
import Transport from 'winston-transport'

describe('Logger', () => {
    let env: string
    let evs: string
    let level: string
    beforeEach(() => {
        env = process.env.NODE_ENV || ''
        evs = process.env.LOG_EVENTS || ''
        level = process.env.LOG_LEVEL || ''
    })
    afterEach(() => {
        process.env.NODE_ENV = env
        process.env.LOG_EVENTS = evs
        process.env.LOG_LEVEL = level
    })
    describe('when no NODE_ENV is not set (aka development)', () => {
        beforeEach(() => {
            process.env.NODE_ENV = ''
        })
        it('logs everything', () => {
            const { logger, consoleLog } = setup()
            logger.trace('trace')
            logger.error('error')
            logger.warn('warn')
            logger.event('event')

            expect(consoleLog).toHaveBeenCalledTimes(4)
            const args = consoleLog.calls.allArgs().map((a) => a[0].level)
            expect(args).toEqual(
                jasmine.arrayWithExactContents([
                    'error',
                    'warning',
                    'trace',
                    'event',
                ])
            )
        })
        it('writes everything as a plain text', () => {
            const { logger, getFormattedMessage } = setup()
            logger.trace('trace')
            const message = getFormattedMessage()
            expect(message).toEqual(jasmine.any(String))
            expect(message).toMatch('trace')
            expect(message).toMatch(String(new Date().getFullYear()))
            expect(() => JSON.parse(message)).toThrow()
        })
    })
    describe('when NODE_ENV is "test"', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'test'
        })
        it('writes noting', async () => {
            const { logger, consoleLog } = setup()
            logger.trace('trace')
            logger.warn('warn')
            logger.error('error')
            logger.event('event')

            expect(consoleLog).not.toHaveBeenCalled()
        })
        it('writes error when LOG_LEVEL is "error"', () => {
            process.env.LOG_LEVEL = 'error'
            const { logger, consoleLog } = setup()
            logger.trace('trace')
            logger.warn('warn')
            logger.error('error')
            logger.event('event')

            expect(consoleLog).toHaveBeenCalledOnceWith(
                jasmine.objectContaining({
                    level: 'error',
                })
            )
        })
        it('writes all but events when LOG_LEVEL is "trace"', () => {
            process.env.LOG_LEVEL = 'trace'
            const { logger, consoleLog } = setup()
            logger.trace('trace')
            logger.error('error')
            logger.warn('warn')
            logger.event('event')

            expect(consoleLog).toHaveBeenCalledTimes(3)
            const args = consoleLog.calls.allArgs().map((a) => a[0].level)
            expect(args).toEqual(
                jasmine.arrayWithExactContents(['error', 'warning', 'trace'])
            )
        })

        it('writes events when LOG_EVENTS set to "true"', () => {
            process.env.LOG_EVENTS = 'true'
            const { logger, consoleLog } = setup()
            logger.event('event')

            expect(consoleLog).toHaveBeenCalledOnceWith(
                jasmine.objectContaining({ level: 'event' })
            )
        })
    })

    describe('when NODE_ENV is "production"', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'production'
        })

        it('sends JSON', () => {
            const { logger, consoleLog, getFormattedMessage } = setup()
            logger.error('error')
            expect(consoleLog).toHaveBeenCalled()
            const message = getFormattedMessage()
            expect(message).toEqual(jasmine.any(String))
            expect(() => JSON.parse(message)).not.toThrow()
            const parsed = JSON.parse(message)
            expect(parsed.timestamp).toMatch(String(new Date().getFullYear()))
        })
        it('DOES NOT sends warnings and notices', () => {
            const { logger, consoleLog } = setup()
            logger.trace('trace')
            logger.error('error')
            logger.warn('warn')

            expect(consoleLog).toHaveBeenCalledOnceWith(
                jasmine.objectContaining({
                    level: 'error',
                })
            )
        })
        it('sends events', () => {
            const { logger, consoleLog } = setup()
            logger.event('event')

            expect(consoleLog).toHaveBeenCalledOnceWith(
                jasmine.objectContaining({
                    level: 'event',
                })
            )
        })
        it('sends what explicitly specified in LOG_LEVEL', () => {
            process.env.LOG_LEVEL = 'trace'
            const { logger, consoleLog } = setup()
            logger.trace('trace')
            logger.error('error')
            logger.warn('warn')

            expect(consoleLog).toHaveBeenCalledTimes(3)
            const args = consoleLog.calls.allArgs().map((a) => a[0].level)
            expect(args).toEqual(
                jasmine.arrayWithExactContents(['error', 'warning', 'trace'])
            )
        })
    })
})

function setup() {
    const spy = jasmine.createSpy('SpyTransport.log', console.log)
    // .and.callThrough()
    class SpyTransport extends Transport {
        log = (info: any, next: () => void) => {
            spy(info), next()
        }
    }
    const getFormattedMessage = () => {
        const message = spy.calls.all()[0]?.args[0]
        if (!message) return ''
        const messageSymbol = Object.getOwnPropertySymbols(message)[1]
        return message[messageSymbol]
    }

    const logger = new Logger({ transport: SpyTransport })

    return { logger, consoleLog: spy, getFormattedMessage }
}
