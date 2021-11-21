export interface Storable {
    id: string
}
export interface Store<T> {
    save: <TT extends T>(doc: TT | (TT & Storable)) => Promise<TT & Storable>
    // FIXME saveBulk should also perform updates
    saveBulk: <TT extends T>(
        docs: Array<TT | (TT & Storable)>
    ) => Promise<Array<TT & Storable>>
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
