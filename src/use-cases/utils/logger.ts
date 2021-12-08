export interface ILogger {
    // For debugging
    /**
     * Errors logged always. When error is thrown all warns and traces from corresponding session
     * are appended to log.
     */
    error: (error: unknown) => void
    /** Log warnings when something suspicious happened */
    warn: (...args: any[]) => void
    /** Trace just about everything you think would be useful to investigate incidents */
    trace: (...args: any[]) => void
    // For event-tracking
    event: (event: string, meta?: EventMeta) => void
}

export interface EventMeta {}
