import { ContextMenuCommandBuilder } from "discord.js";
import TClient from "./client.js";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { URL } from "node:url";
import { Command, Event } from "#structures";
import { fsServers, log } from "#util";

const client = new TClient();

Error.stackTraceLimit = 25;
console.log(client.config.toggles);
console.log(client.config.devWhitelist);
console.log(fsServers.keys());

if (client.config.toggles.debug) client.on("debug", console.log);

for (const { id } of client.config.ytChannels) client.ytCache[id] = null;
for (const serverAcro of fsServers.keys())
    client.fsCache[serverAcro] = {
        players: [],
        lastAdmin: null,
        graphPoints: [],
        completeRes: null,
        state: null,
        throttled: null,
    };

// Command handler
for (const folder of await readdir("commands")) {
    for (const file of await readdir(join("commands", folder))) {
        const commandPath = new URL(join("commands", folder, file), import.meta.url);
        const { default: commandFile } = await import(commandPath.toString());

        if (!(commandFile instanceof Command)) {
            log("Red", `${file} not Command`);

            continue;
        }

        const collectionType = commandFile.data instanceof ContextMenuCommandBuilder ? "contextMenuCommands" : "chatInputCommands";

        client[collectionType].set(commandFile.data.name, commandFile);
    }
}

// Event handler
for (const file of await readdir("events")) {
    const eventPath = new URL(join("events", file), import.meta.url);
    const { default: eventFile } = await import(eventPath.toString());

    if (!(eventFile instanceof Event)) {
        log("Red", `${file} not Event`);

        continue;
    }

    client[eventFile.once ? "once" : "on"](eventFile.name, eventFile.run);
}

await client.login(client.config.TOKEN);

process.on("unhandledRejection", client.errorLog.bind(client));
process.on("uncaughtException", client.errorLog.bind(client));
process.on("error", client.errorLog.bind(client));
client.on("error", client.errorLog);
