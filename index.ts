import { EmbedBuilder } from 'discord.js';
import YClient from './client.js';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { log } from './utilities.js';
import { Command, Prettify } from './typings.js';

const client = new YClient();
const fsKeys = Object.keys(client.config.fs);

/** Error handler */
function errorLog(error: Error) {
    if (['Request aborted', 'getaddrinfo ENOTFOUND discord.com'].includes(error.message)) return;

    const dirname = process.cwd().replaceAll('\\', '/');
    const channel = client.getChan('taesTestingZone');
    const formattedErr = error.stack
        ?.replaceAll(' at ', ' [31mat[37m ')
        .replaceAll(dirname, `[33m${dirname}[37m`)
        .slice(0, 2500);

    if (!channel) return console.log(error);

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

mongoose.set('strictQuery', true).connect(client.config.mongoURL, {
    autoIndex: true,
    serverSelectionTimeoutMS: 5_000,
    socketTimeoutMS: 45_000,
    family: 4,
    waitQueueTimeoutMS: 50_000
}).then(() => log('Purple', 'Connected to MongoDB'));

client.login(client.config.token);
client.setMaxListeners(100);
console.log(client.config.botSwitches);
console.log(client.config.devWhitelist);
console.log(fsKeys);

for (const [chanId, _] of client.config.ytCacheChannels) client.ytCache[chanId] = null;
for (const serverAcro of fsKeys) client.fsCache[serverAcro] = { players: [], status: null, lastAdmin: null };

// Command handler
for await (const file of fs.readdirSync(path.resolve('./commands'))) {
    const commandFile: { default: Prettify<Omit<Command, 'uses'>> }  = await import(`./commands/${file}`);

    client.commands.set(commandFile.default.data.name, {  uses: 0, ...commandFile.default });
}

// Event handler
for await (const file of fs.readdirSync(path.resolve('./events'))) {
    const eventFile = await import(`./events/${file}`);

    client.on(file.replace('.js', ''), eventFile.default);
}

process.on('unhandledRejection', errorLog);
process.on('uncaughtException', errorLog);
process.on('error', errorLog);
client.on('error', errorLog);
client.on('intErr', errorLog);