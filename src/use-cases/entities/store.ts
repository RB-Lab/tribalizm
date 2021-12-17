export interface Storable {
    id: string
}

export type Query<T, K extends keyof T | 'id'> = Partial<
    Record<K, (T & Storable)[K] | Array<(T & Storable)[K]>>
>
export interface Page {
    cursor?: string
    limit?: number
}

export interface Store<T> {
    save: <TT extends T>(doc: TT | (TT & Storable)) => Promise<TT & Storable>
    // TODO saveBulk should also perform updates
    saveBulk: <TT extends T>(
        docs: Array<TT | (TT & Storable)>
    ) => Promise<Array<TT & Storable>>
    getById: (id: string) => Promise<(T & Storable) | null>
    // TODO divide onto storable object and object data, so that you won't try
    //      to find stuff by methods
    findSimple: <K extends keyof T | 'id'>(
        query: Query<T, K>
    ) => Promise<Array<T & Storable>>
    find: <K extends keyof T | 'id'>(
        query: Query<T, K>,
        filter: Query<T, K> | Page,
        page: Page
    ) => Promise<Array<T & Storable>>
}
