import Discord from 'discord.js';
import YClient from './client.js';
import FSLoop from './FSLoop.js';
import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

console.log('\x1b[32mStartup');
const client = await new YClient().init();
console.log(client.config.botSwitches);
console.log(client.config.devWhitelist);
client.once("ready", async () => {
	await client.guilds.fetch(client.config.mainServer.id).then(async guild => {
		await guild.members.fetch();
		setInterval(async () => (await guild.invites.fetch()).forEach(inv => client.invites.set(inv.code, { uses: inv.uses, creator: inv.inviter?.id })), 500000);
		if (client.config.botSwitches.registerCommands) guild.commands.set(client.registry).then(() => client.log('\x1b[35m', 'Slash commands registered')).catch(e => console.log(`Couldn't register commands bcuz: ${e}`));
	});
	// Playing: 0 & 1, Listening: 2, Watching: 3, N/A: 4, Competing in: 5
	setInterval(() => client.user?.setPresence(client.config.botPresence), 3600000);

	const channel = client.channels.resolve(client.config.mainServer.channels.testing_zone) as Discord.TextChannel;
	await channel.send(`:warning: Bot restarted :warning:\n<@${client.config.devWhitelist[0]}>\n\`\`\`json\n${Object.entries(client.config.botSwitches).map(x => `${x[0]}: ${x[1]}`).join('\n')}\`\`\``);
	client.log('\x1b[34m', `Bot active as ${client.user?.tag}`);
});

// Error handler
function logError(error: Error, from: string) { // I'm well aware my internet is bad, I don't need my own bot to rub it in
	if (client.config.botSwitches.errorNotify && !['Request aborted', 'getaddrinfo ENOTFOUND discord.com'].includes(error.message) && client.isReady()) {
		const channel = client.channels.resolve(client.config.mainServer.channels.testing_zone) as Discord.TextChannel;
		const Dirname = join(dirname(fileURLToPath(import.meta.url))).replaceAll('\\', '/');
		channel.send({content: `<@${client.config.devWhitelist[0]}>`, embeds: [new client.embed().setTitle(`Error Caught - ${error.message}`).setColor("#420420").setDescription(`\`\`\`ansi\n${error.stack?.replaceAll(' at ', ' [31mat[37m ').replaceAll(Dirname, `[33m${Dirname}[37m`).slice(0, 2500)}\`\`\``).setTimestamp().setFooter({text: from})]});
	}
}
process.on('unhandledRejection', (error: Error) => logError(error, 'unhandledRejection'));
process.on('uncaughtException', (error: Error) => logError(error, 'uncaughtException'));
process.on('error', (error: Error) => logError(error, 'error'));
client.on('error', (error: Error) => logError(error, 'client-error'));

// Reminder, dailyMsgs, and punishment event loops
setInterval(async () => {
	const now = Date.now();
	const Reminders = await client.reminders._content.find().then(x => x.filter(x => now > x.time));
	const Punishments = await client.punishments._content.find().then(x => x.filter(x => x.endTime && x.endTime <= now && !x.expired));

	Reminders.forEach(async reminder => {
		const embed = new client.embed().setTitle('Reminder').setColor(client.config.embedColor).setDescription(`\`\`\`${reminder.content}\`\`\``);
		await client.users.fetch(reminder.userid).then(User => User.send({embeds: [embed]}).catch(() =>
			(client.channels.resolve(reminder.ch) as Discord.TextChannel).messages.fetch(reminder.msg).then(msg => msg.reply({ content:`<@${reminder.userid}>`, embeds: [embed]}))
		));
		await client.reminders._content.findByIdAndDelete(reminder._id);
		client.log('\x1b[33m', 'REMINDER EXECUTE', reminder);
	});

	Punishments.forEach(punishment => {
		client.log('\x1b[33m', `${punishment.member.tag}\'s ${punishment.type} should expire now`);
		client.punishments.removePunishment(punishment._id, (client.user as Discord.ClientUser).id, "Time\'s up!").then(result => client.log('\x1b[33m', result));
	});

	const formattedDate = Math.floor((now - 1667854800000) / 1000 / 60 / 60 / 24);
	const dailyMsgs = JSON.parse(fs.readFileSync('../databases/dailyMsgs.json', 'utf8'));
	if (!dailyMsgs.some((x: Array<number>) => x[0] === formattedDate)) {
		let total = (await client.userLevels._content.find()).reduce((a, b) => a + b.messages, 0); // sum of all users
		const yesterday = dailyMsgs.find((x: Array<number>) => x[0] === formattedDate - 1);
		if (total < yesterday) total = yesterday; // messages went down

		dailyMsgs.push([formattedDate, total]);
		fs.writeFileSync('../databases/dailyMsgs.json', JSON.stringify(dailyMsgs, null, 4));
		client.log('\x1b[36m', `Pushed [${formattedDate}, ${total}] to dailyMsgs`);
		(client.channels.resolve(client.config.mainServer.channels.testing_zone) as Discord.TextChannel).send(`:warning: Pushed [${formattedDate}, ${total}] to </rank leaderboard:1042659197919178790>`);

		setTimeout(() => {
			client.log('\x1b[36m', 'Interval messages');
			const Day = Date().toLowerCase();
			const channel = client.channels.resolve(client.config.mainServer.channels.testing_zone) as Discord.TextChannel;

			channel.send('<:IRT_RollSee:908055712368853002>');

			if (Day.startsWith('fri')) {
				channel.send('It\'s the weekend! <a:IRT_FrogClap:722536810399662160>');
			} else if (Day.startsWith('sun')) channel.send('Oh no! It\'s Monday... <:IRT_FrogBans:605519995761590273>');
		}, 10_800_000); // 3 hour timeout, account for time zone differences
	}
}, 5000);

// Farming Simulator 22 stats loops
if (client.config.botSwitches.FSLoop) setInterval(() => client.config.FSCacheServers.forEach(srv => FSLoop(client, srv[0], srv[1], srv[2])), 30_000);

// YouTube upload nofitcations loop
if (client.config.botSwitches.YTLoop) setInterval(() => client.config.YTCacheChannels.forEach(ch => client.YTLoop(ch[0], ch[1])), 300_000);
