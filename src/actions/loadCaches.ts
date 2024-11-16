import type { Client } from "discord.js";
import { fs22Servers, fs25Servers } from "#util";

export function loadCaches(client: Client) {
    Reflect.set(client, "ytCache", Object.fromEntries(
        client.config.ytChannels.map(x => [x.id, null])
    ) satisfies Client["ytCache"]);

    Reflect.set(client, "fs22Cache", Object.fromEntries(
        fs22Servers.keys().map(x => [x, {
            players: [],
            lastAdmin: null,
            graphPoints: [],
            completeRes: null,
            state: null,
            throttled: null,
        }])
    ) satisfies Client["fs22Cache"]);

    Reflect.set(client, "fs25Cache", Object.fromEntries(
        fs25Servers.keys().map(x => [x, {
            players: [],
            lastAdmin: null,
            graphPoints: [],
            completeRes: null,
            state: null,
            throttled: null,
        }])
    ) satisfies Client["fs25Cache"]);
}
