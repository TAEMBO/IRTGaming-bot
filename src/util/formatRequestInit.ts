import config from "#config" with { type: "json" };

/**
 * Create a request init object for making fetches with
 * @param timeout The timeout before the request expires
 * @param identifier The identifier in the user agent for what feature is doing this request
 */
export function formatRequestInit<
    TIdentifier extends string,
    THeaders extends Record<string, string>
>(timeout: number, identifier: TIdentifier, headers: THeaders = {} as THeaders) {
    return {
        signal: AbortSignal.timeout(timeout),
        headers: { "User-Agent": `${config.USER_AGENT_HEADER}/${identifier}` as const, ...headers }
    };
}