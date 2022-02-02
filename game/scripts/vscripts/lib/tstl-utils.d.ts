export declare function reloadable<T extends {
    new (...args: any[]): {};
}>(constructor: T): T;
