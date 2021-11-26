// TODO move all errors here so that it woould be easier to keep trhack of them
//      and check if all translations are in place

export class QuestFinishedError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
