export default class Deferred<T> {
    private _promise: Promise<T>;
    private _resolve!: (value: T) => void;
    private _reject!: (reason: any) => void;

    constructor() {
        this._promise = new Promise<T>((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    get promise(): Promise<T> {
        return this._promise;
    }

    resolve(value: T) {
        this._resolve(value);
    }

    reject(reason: any) {
        this._reject(reason);
    }
}
