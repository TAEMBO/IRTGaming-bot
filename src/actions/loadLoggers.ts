import { fs22Servers, fs25Servers } from "#util";
import type { Client } from "discord.js";

export function loadLoggers(client: Client) {
    console.log(client.config.toggles);
    console.log(client.config.devWhitelist);
    console.log(fs22Servers.keys());
    console.log(fs25Servers.keys());

    if (client.config.toggles.debug) client.on("debug", console.log).on("cacheSweep", console.log);

    process.on("unhandledRejection", client.errorLog.bind(client));
    process.on("uncaughtException", client.errorLog.bind(client));
    process.on("error", client.errorLog.bind(client));
    client.on("error", client.errorLog);
}
