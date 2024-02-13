import { ContextMenuCommandBuilder, EmbedBuilder } from "discord.js";
import TClient from "./client.js";
import fs from "node:fs";
import path from "node:path";

const client = new TClient();
const fsKeys = Object.keys(client.config.fs);

Error.stackTraceLimit = 25;
client.setMaxListeners(100);
console.log(client.config.toggles);
console.log(client.config.devWhitelist);
console.log(fsKeys);

for (const { id } of client.config.ytChannels) client.ytCache[id] = null;
for (const serverAcro of fsKeys) client.fsCache[serverAcro] = { players: [], status: null, lastAdmin: null, graphPoints: [] };

// Command handler
for await (const folder of fs.readdirSync(path.resolve("./commands"))) {
    for await (const file of fs.readdirSync(path.resolve("./commands", folder))) {
        const commandFile = await import(`./commands/${folder}/${file}`);
        const collectionType = commandFile.default.data instanceof ContextMenuCommandBuilder ? "contextMenuCommands": "chatInputCommands";

        client[collectionType].set(commandFile.default.data.name, commandFile.default);
    }
}

// Event handler
for await (const file of fs.readdirSync(path.resolve("./events"))) client.on(file.replace(".js", ""), (await import(`./events/${file}`)).default);

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