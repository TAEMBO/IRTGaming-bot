import YClient from './client.js';
import { errorLog, mainLoop, YTLoop, FSLoop, FSLoopAll } from './utilities.js';

const client = new YClient();

console.log(client.config.botSwitches);
console.log(client.config.devWhitelist);

// Error handler
process.on('unhandledRejection', (error: Error) => errorLog(client, error, 'unhandledRejection'));
process.on('uncaughtException', (error: Error) => errorLog(client, error, 'uncaughtException'));
process.on('error', (error: Error) => errorLog(client, error, 'process-error'));
client.on('error', (error: Error) => errorLog(client, error, 'client-error'));

// Reminders, dailyMsgs, and punishments loop
setInterval(() => mainLoop(client), 5_000);

// Farming Simulator 22 stats loop
if (client.config.botSwitches.FSLoop) setInterval(async () => {
	const watchList = await client.watchList._content.find();

	for await (const server of client.config.FSCacheServers) await FSLoop(client, watchList, server[0], server[1], server[2]);
	FSLoopAll(client, watchList);
}, 30_000);

// YouTube upload nofitcations loop
if (client.config.botSwitches.YTLoop) setInterval(() => client.config.YTCacheChannels.forEach(ch => YTLoop(client, ch[0], ch[1])), 300_000);
