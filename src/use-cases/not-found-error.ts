// TODO move EntityNotFound errors into stores to the method like
//      getByIdOrThrow(id: string);
//      Add entity ID and store name to the error, so that it could be i18n'd

export class EntityNotFound extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
