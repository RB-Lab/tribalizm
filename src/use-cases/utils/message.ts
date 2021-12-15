export interface Message {
    type: string
    payload: {
        targetUserId: string
    }
}
