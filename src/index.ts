import { ContextMenuCommandBuilder } from "discord.js";
import TClient from "./client.js";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, URL, pathToFileURL } from "node:url";
import { Command, Event } from "./structures/index.js";
import { log } from "./util/index.js";

const client = new TClient();
const fsKeys = Object.keys(client.config.fs);
const urlPath = (path: string) => pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).toString();

Error.stackTraceLimit = 25;
console.log(client.config.toggles);
console.log(client.config.devWhitelist);
console.log(fsKeys);

if (client.config.toggles.debug) client.on("debug", console.log);

for (const { id } of client.config.ytChannels) client.ytCache[id] = null;
for (const serverAcro of fsKeys) client.fsCache[serverAcro] = {
    players: [],
    status: null,
    lastAdmin: null,
    graphPoints: [],
    isThrottled: null
};

// Command handler
for (const folder of await readdir("commands")) {
    for (const file of await readdir(join("commands", folder))) {
        const commandFile = (await import(urlPath(join("commands", folder, file)))).default;

        if (!(commandFile instanceof Command)) {
            log("Red", `${file} not Command`);
    
            continue;
        }

        const collectionType = commandFile.data instanceof ContextMenuCommandBuilder
            ? "contextMenuCommands"
            : "chatInputCommands";

        client[collectionType].set(commandFile.data.name, commandFile);
    }
}

// Event handler
for (const file of await readdir("events")) {
    const eventFile = (await import(urlPath(join("events", file)))).default;

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
client.on("error", client.errorLog.bind(client));