export interface Storable {
    id: string
}
export interface Store<T> {
    save: (doc: T | (T & Storable)) => Promise<T & Storable>
    // FIXME saveBulk should also perform updates
    saveBulk: (docs: Array<T | (Storable & T)>) => Promise<Array<T & Storable>>
    getById: (id: string) => Promise<(T & Storable) | null>
    // TODO devide onto storable object and object data, so that you won't try
    //      to find stuff by methods
    find: <K extends keyof T | 'id'>(
        query: Partial<Record<K, (T & Storable)[K] | Array<(T & Storable)[K]>>>,
        page?: {
            cursor?: string
            limit?: number
        }
    ) => Promise<Array<T & Storable>>
}
