import Discord from 'discord.js';
import YClient from './client';
import moment from 'moment';
import fs from 'node:fs';
import path from 'node:path';
import { db_punishments_format, db_userLevels_format, Reminder } from './interfaces'
const client = new YClient();
client.init();

console.log(client.config.botSwitches);
console.log(client.config.devWhitelist);

// global properties
client.on("ready", async () => {
	const guild = client.guilds.cache.get(client.config.mainServer.id) as Discord.Guild;
	await guild.members.fetch();
	(client.channels.resolve(client.config.mainServer.channels.testing_zone) as Discord.TextChannel).send(`:warning: Bot restarted :warning:\n<@${client.config.devWhitelist[0]}>\n\`\`\`js\n${Object.entries(client.config.botSwitches).map((x)=> `${x[0]}: ${x[1]}`).join('\n')}\`\`\``)
	setInterval(()=>{
		guild.invites.fetch().then((invs)=>{
			invs.forEach(async(inv)=>{
				client.invites.set(inv.code, {uses: inv.uses, creator: (inv.inviter as Discord.User).id})
			})
		})
	}, 500000)
	if (client.config.botSwitches.registerCommands) guild.commands.set(client.registery).catch((e)=>{console.log(`Couldn't register commands bcuz: ${e}`)});

	setInterval(async () => {
		(client.user as Discord.ClientUser).setPresence(client.config.botPresence);
		// Playing: 0 & 1, Listening: 2, Watching: 3, N/A: 4, Competing in: 5
	}, 60000);
	console.log(`[${moment().format('HH:mm:ss')}] Bot active as ${(client.user as Discord.ClientUser).tag}`);

	// event handler
	const eventFiles = fs.readdirSync('./events').filter((file: any) => file.endsWith('.ts'));
    eventFiles.forEach((file: any)=>{
    	const event = require(`./events/${file}`);
	    client.on(event.default.name, async (...args) => event.default.execute(client, ...args));
    });
});

// error handlers
function logError(error: Error) {
	console.log(error);                    // vvv I'm well aware my internet is bad, I don't need my own bot to rub it in
	if (client.config.botSwitches.errorNotify && !['Request aborted', 'getaddrinfo ENOTFOUND discord.com'].includes(error.message)) (client.channels.resolve(client.config.mainServer.channels.testing_zone) as Discord.TextChannel).send({content: `<@${client.config.devWhitelist[0]}>`, embeds: [new client.embed().setTitle("Error Caught!").setColor("#420420").setDescription(`**Error:** \`${error.message}\`\n\n**Stack:** \`${`${error.stack}`.slice(0, 2500)}\``).setTimestamp()]});
}
process.on('unhandledRejection', (error: Error) => {
	logError(error);
});
process.on('uncaughtException', (error: Error) => {
	logError(error);
});
process.on('error', (error: Error) => {
	logError(error);
});
client.on('error', (error: Error) => {
	logError(error);
});

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
		console.log('REMINDER EXECUTE', filter[i]);
		db.splice(db.findIndex((x: Reminder) => filterLambda(x)), 1);
		fs.writeFileSync(p, db.length !== 0 ? JSON.stringify(db, null, 2) : '[]');
	}
	
	client.punishments._content.filter((x: db_punishments_format) => (x?.endTime as number) <= now && !x.expired).forEach(async (punishment: db_punishments_format) => {
		console.log(`[${client.moment().format('HH:mm:ss')}]`, `${punishment.member}\'s ${punishment.type} should expire now`);
		const unpunishResult = await client.punishments.removePunishment(punishment.id, (client.user as Discord.ClientUser).id, "Time\'s up!");
		console.log(`[${client.moment().format('HH:mm:ss')}]`, unpunishResult);
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
		console.log(`[${client.moment().format('HH:mm:ss')}]`, `Pushed [${formattedDate}, ${total}] to dailyMsgs`);
		(client.channels.resolve(client.config.mainServer.channels.testing_zone) as Discord.TextChannel).send(`:warning: Pushed [${formattedDate}, ${total}] to </rank leaderboard:1042659197919178790>`);

	}
}, 5000);

// Farming Simulator 22 stats loops
if (client.config.botSwitches.stats) {
	setInterval(async () => {
		client.FSLoop(client.tokens.ps.dss, client.tokens.ps.csg, '891791005098053682', '980240981922291752', 'PS')
		client.FSLoop(client.tokens.pg.dss, client.tokens.pg.csg, '729823615096324166', '980241004718329856', 'PG')
		client.FSLoop(client.tokens.mf.dss, client.tokens.mf.csg, '982143077554720768', '985586585707900928', 'MF')
	}, 30000)
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
