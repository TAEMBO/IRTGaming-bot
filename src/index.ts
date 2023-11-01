import TClient from './client.js';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { log } from './utilities.js';
import { Command, Prettify } from './typings.js';

const client = new TClient();
const fsKeys = Object.keys(client.config.fs);

await mongoose.set('strictQuery', true).connect(client.config.mongoURL, {
    autoIndex: true,
    serverSelectionTimeoutMS: 5_000,
    socketTimeoutMS: 45_000,
    family: 4,
    waitQueueTimeoutMS: 50_000
}).then(() => log('Purple', 'Connected to MongoDB'));

Error.stackTraceLimit = 25;
client.setMaxListeners(100);
console.log(client.config.botSwitches);
console.log(client.config.devWhitelist);
console.log(fsKeys);

for (const [chanId, _] of client.config.ytCacheChannels) client.ytCache[chanId] = null;
for (const serverAcro of fsKeys) client.fsCache[serverAcro] = { players: [], status: null, lastAdmin: null, graphPoints: [] };

// Command handler
for await (const file of fs.readdirSync(path.resolve('./commands'))) {
    const commandFile: { default: Prettify<Omit<Command, 'uses'>> } = await import(`./commands/${file}`);

    client.commands.set(commandFile.default.data.name, { uses: 0, ...commandFile.default });
}

// Event handler
for await (const file of fs.readdirSync(path.resolve('./events'))) client.on(file.replace('.js', ''), (await import(`./events/${file}`)).default);

await client.login(client.config.token);

process.on('unhandledRejection', client.errorLog);
process.on('uncaughtException', client.errorLog);
process.on('error', client.errorLog);
client.on('error', client.errorLog);