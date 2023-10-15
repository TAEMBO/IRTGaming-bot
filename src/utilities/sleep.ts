/**
 * Halt execution for a specified duration of time
 * @param ms The amount of milliseconds to halt execution for
 */
export async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}