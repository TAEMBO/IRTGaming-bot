/**
 * Perform a runtime-safe object literal lookup containing functions
 * @param obj 
 * @param key 
 * @returns The return value of the given function key name, if there is one
 */
export function lookup<TObj extends Record<string, () => any>>(obj: TObj, key: string): ReturnType<typeof value> {
    const value = obj[key as keyof TObj];

    if (!value) throw new Error(`ooLookup: Missing key ${key}`);
    
    return value();
}