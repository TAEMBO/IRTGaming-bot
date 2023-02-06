import Discord from 'discord.js';
import YClient from './client';
import moment from 'moment';
import fs from 'node:fs';
import path from 'node:path';
import FSLoop from './FSLoop';
import { db_punishments_format, db_userLevels_format, Reminder } from './interfaces';
const client = new YClient();
client.init();

console.log(client.config.botSwitches);
console.log(client.config.devWhitelist);

client.on("ready", async () => {
	await client.guilds.fetch(client.config.mainServer.id).then(async guild => {
		await guild.members.fetch();
		setInterval(() => guild.invites.fetch().then(invs=> invs.forEach((inv) => client.invites.set(inv.code, {uses: inv.uses, creator: inv.inviter?.id}))), 500000);
		if (client.config.botSwitches.registerCommands) guild.commands.set(client.registery).catch(e => console.log(`Couldn't register commands bcuz: ${e}`));
	});

	// Playing: 0 & 1, Listening: 2, Watching: 3, N/A: 4, Competing in: 5
	client.user?.setPresence(client.config.botPresence);
	setInterval(() => client.user?.setPresence(client.config.botPresence), 1800000);
	
	// Event handler
    fs.readdirSync('./events').forEach(file => {
    	const eventFile = require(`./events/${file}`);
	    client.on(file.replace('.ts', ''), async (...args) => eventFile.default(client, ...args));
    });
	const channel = client.channels.resolve(client.config.mainServer.channels.testing_zone) as Discord.TextChannel;
	await channel.send(`:warning: Bot restarted :warning:\n<@${client.config.devWhitelist[0]}>\n\`\`\`json\n${Object.entries(client.config.botSwitches).map((x)=> `${x[0]}: ${x[1]}`).join('\n')}\`\`\``);

	console.log(client.timeLog('\x1b[34m'), `Bot active as ${client.user?.tag}`);
});

// Error handler
function logError(error: Error, from: string) {
	console.log(client.timeLog('\x1b[31m'), error); // vvv I'm well aware my internet is bad, I don't need my own bot to rub it in
	if (client.config.botSwitches.errorNotify && !['Request aborted', 'getaddrinfo ENOTFOUND discord.com'].includes(error.message)) {
		const channel = client.channels.resolve(client.config.mainServer.channels.testing_zone) as Discord.TextChannel;
		channel.send({content: `<@${client.config.devWhitelist[0]}>`, embeds: [new client.embed().setTitle(`Error Caught - ${error.message}`).setColor("#420420").setDescription(`\`\`\`ansi\n${error.stack?.replaceAll(' at ', ' [31mat[37m ').replaceAll(__dirname, `[33m${__dirname}[37m`).slice(0, 2500)}\`\`\``).setTimestamp().setFooter({text: from})]});
	}
}
process.on('unhandledRejection', (error: Error) => logError(error, 'unhandledRejection'));
process.on('uncaughtException', (error: Error) => logError(error, 'uncaughtException'));
process.on('error', (error: Error) => logError(error, 'error'));
client.on('error', (error: Error) => logError(error, 'client-error'));

// reminder, dailyMsgs, and punishment event loops
setInterval(async () => {
	const now = Date.now();
	const p = path.join(__dirname, './databases/reminders.json');
	const db = JSON.parse(fs.readFileSync(p, {encoding: 'utf8'}));
	const remindEmbed = new client.embed().setTitle('Reminder').setColor(client.config.embedColor);
	const filterLambda = (x: Reminder) => x.when < Math.floor(now / 1000);
	const filter: Array<Reminder> = db.filter((x: Reminder) => filterLambda(x));
	for(let i = 0; i < filter.length; i++){
		remindEmbed.setDescription(`\n\`\`\`${filter[i].what}\`\`\``);
		await client.users.fetch(filter[i].who).then(User => User.send({embeds: [remindEmbed]}));
		console.log(client.timeLog('\x1b[33m'), 'REMINDER EXECUTE', filter[i]);
		db.splice(db.findIndex((x: Reminder) => filterLambda(x)), 1);
		fs.writeFileSync(p, db.length !== 0 ? JSON.stringify(db, null, 2) : '[]');
	}
	
	client.punishments._content.filter((x: db_punishments_format) => (x?.endTime as number) <= now && !x.expired).forEach(async (punishment: db_punishments_format) => {
		console.log(client.timeLog('\x1b[33m'), `${punishment.member}\'s ${punishment.type} should expire now`);
		const unpunishResult = await client.punishments.removePunishment(punishment.id, (client.user as Discord.ClientUser).id, "Time\'s up!");
		console.log(client.timeLog('\x1b[33m'), unpunishResult);
	});

	const formattedDate = Math.floor((now - 1667854800000) / 1000 / 60 / 60 / 24);
	const dailyMsgs = JSON.parse(fs.readFileSync(__dirname + '/databases/dailyMsgs.json', {encoding: 'utf8'}));
	if (!dailyMsgs.some((x: Array<number>) => x[0] === formattedDate)) {
		let total = Object.values<db_userLevels_format>(client.userLevels._content).reduce((a, b) => a + b.messages, 0); // sum of all users
		const yesterday = dailyMsgs.find((x: Array<number>) => x[0] === formattedDate - 1);
		if (total < yesterday) { // messages went down
			total = yesterday;
		}
		dailyMsgs.push([formattedDate, total]);
		fs.writeFileSync(__dirname + "/databases/dailyMsgs.json", JSON.stringify(dailyMsgs, null, 2));
		console.log(client.timeLog('\x1b[36m'), `Pushed [${formattedDate}, ${total}] to dailyMsgs`);
		(client.channels.resolve(client.config.mainServer.channels.testing_zone) as Discord.TextChannel).send(`:warning: Pushed [${formattedDate}, ${total}] to </rank leaderboard:1042659197919178790>`);

	}
}, 5000);

// Farming Simulator 22 stats loops
if (client.config.botSwitches.stats) {
	setInterval(async () => {
		FSLoop(client, client.tokens.fs.ps.dss, client.tokens.fs.ps.csg, '891791005098053682', '980240981922291752', 'PS');
		FSLoop(client, client.tokens.fs.pg.dss, client.tokens.fs.pg.csg, '729823615096324166', '980241004718329856', 'PG');
		//FSLoop(client, client.tokens.fs.mf.dss, client.tokens.fs.mf.csg, '982143077554720768', '985586585707900928', 'MF');
	}, 30000);
}

// YouTube upload nofitcations loop
if (client.config.botSwitches.notifs) {
	setInterval(async () => {
		client.YTLoop('UCQ8k8yTDLITldfWYKDs3xFg', 'Daggerwin');
		client.YTLoop('UCLIExdPYmEreJPKx_O1dtZg', 'IRTGaming');
		client.YTLoop('UCguI73--UraJpso4NizXNzA', 'Machinery Restorer');
		client.YTLoop('UCuNIKo9EMJZ_FdZfGnM9G1w', 'Tom Pemberton Farm Life');
		client.YTLoop('UCKXa-FhJpPrlRigIW1O0j8g', 'Alan McPhearson');
		client.YTLoop('UCWYXg1sqtG9NalK5ZGt4ITA', 'Chainsaw100');
	}, 300000)
}
