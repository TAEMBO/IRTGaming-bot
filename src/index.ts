import { type ClientEvents, ContextMenuCommandBuilder, EmbedBuilder } from "discord.js";
import TClient from "./client.js";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, URL, pathToFileURL } from "node:url";
import type { Event } from "./structures/index.js";

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
for await (const folder of await readdir("commands")) {
    for await (const file of await readdir(join("commands", folder))) {
        const commandFile = (await import(urlPath(join("commands", folder, file)))).default;
        const collectionType = commandFile.data instanceof ContextMenuCommandBuilder
            ? "contextMenuCommands"
            : "chatInputCommands";

        client[collectionType].set(commandFile.data.name, commandFile);
    }
}

// Event handler
for await (const file of await readdir("events")) {
    const eventFile: Event<keyof ClientEvents> = (await import(urlPath(join("events", file)))).default;

    client[eventFile.once ? "once" : "on"](eventFile.name, eventFile.run);
}

await client.login(client.config.TOKEN);

function errorLog(error: Error) {
    console.error(error);

    if (["Request aborted", "getaddrinfo ENOTFOUND discord.com"].includes(error.message)) return;

    const dirname = process.cwd().replaceAll("\\", "/");
    const channel = client.getChan("taesTestingZone");
    const formattedErr = error.stack
        ?.replaceAll(" at ", " [31mat[37m ")
        .replaceAll(dirname, `[33m${dirname}[37m`)
        .slice(0, 2500);

    if (!channel) return;

    channel.send({
        content: `<@${client.config.devWhitelist[0]}>`,
        embeds: [new EmbedBuilder()
            .setTitle(`Error Caught - ${error.message.slice(0, 240)}`)
            .setColor("#420420")
            .setDescription(`\`\`\`ansi\n${formattedErr}\`\`\``)
            .setTimestamp()
        ]
    });
}

process.on("unhandledRejection", errorLog);
process.on("uncaughtException", errorLog);
process.on("error", errorLog);
client.on("error", errorLog);
client.on("intErr", errorLog);