import config from "../config.json" assert { type: "json" };

/**
 * Create a request init object for making fetches with
 * @param timeout The timeout before the request expires
 * @param identifier The identifier in the user agent for what feature is doing this request
 */
export function formatRequestInit<S extends string>(timeout: number, identifier: S) {
    return {
        signal: AbortSignal.timeout(timeout),
        headers: { 'User-Agent': `${config.USER_AGENT_HEADER}/${identifier}` as const }
    };
}