export interface Storable {
    id: string
}
export interface Store<T> {
    save: (doc: T | (T & Storable)) => Promise<T & Storable>
    saveBulk: (docs: T[]) => Promise<Array<T & Storable>>
    getById: (id: string) => Promise<(T & Storable) | null>
    // TODO devide onto storable object and object data, so that you won't try
    //      to find stuff by methods
    find: <K extends keyof T | 'id'>(
        query: Partial<Record<K, (T & Storable)[K] | Array<(T & Storable)[K]>>>
    ) => Promise<Array<T & Storable>>
}
