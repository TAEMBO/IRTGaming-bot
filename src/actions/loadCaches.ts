import type { Client } from "discord.js";
import { fsServers } from "#util";

export function loadCaches(client: Client) {
    Reflect.set(client, "ytCache", Object.fromEntries(
        client.config.ytChannels.map(x => [x.id, null])
    ) satisfies Client["ytCache"]);

    Reflect.set(client, "fsCache", Object.fromEntries(
        fsServers.keys().map(x => [x, {
            players: [],
            lastAdmin: null,
            graphPoints: [],
            completeRes: null,
            state: null,
            throttled: null,
        }])
    ) satisfies Client["fsCache"]);
}
