// TODO Message is not entyti it is a common interface of pub-sub DTOs for use-cases

export interface Message {
    type: string
    payload: {
        // TODO ucnomment this
        // targetUserId: string
        // targetMemberId: string
    }
}
