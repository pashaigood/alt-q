export function memoize<T>(fn: (...args: any[]) => T): (...args: any[]) => T | undefined {
    const cache = new Map<string, T>();
    return (...args: any[]) => {
        const key = args.join(',');
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
    };
}