// TODO move all errors here so that it woould be easier to keep trhack of them
//      and check if all translations are in place

export class QuestFinishedError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export class WrongQuestTypeError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

// Initiation errors
export class NotListedElderError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export class AlreadyApprovedError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export class ApplicationFinishedError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
export class WrongElderError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

// TODO move EntityNotFound errors into stores to the method like
//      getByIdOrThrow(id: string);
//      Add entity ID and store name to the error, so that it could be i18n'd

// TODO 🤔 make a common test on not found errors?
export class EntityNotFound extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
