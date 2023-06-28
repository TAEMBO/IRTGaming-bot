import Discord from 'discord.js';
import YClient from './client.js';
import FSLoop, { FSLoopAll } from './FSLoop.js';
import fs from 'node:fs';
import path from 'node:path';
import { LogColor } from './typings.js';

console.log('\x1b[32mStartup');
const client = await new YClient().init();
console.log(client.config.botSwitches);
console.log(client.config.devWhitelist);

/** Error handler */
function logError(error: Error, event: string) {
    if (!['Request aborted', 'getaddrinfo ENOTFOUND discord.com'].includes(error.message) && client.isReady()) {
        const dirname = process.cwd().replaceAll('\\', '/');
        client.getChan('taesTestingZone').send({
            content: `<@${client.config.devWhitelist[0]}>`,
            embeds: [new client.embed()
                .setTitle(`Error Caught - ${error.message}`)
                .setColor("#420420")
                .setDescription(`\`\`\`ansi\n${error.stack?.replaceAll(' at ', ' [31mat[37m ').replaceAll(dirname, `[33m${dirname}[37m`).slice(0, 2500)}\`\`\``)
                .setTimestamp()
                .setFooter({ text: event })
            ]
        });
    }
}
process.on('unhandledRejection', (error: Error) => logError(error, 'unhandledRejection'));
process.on('uncaughtException', (error: Error) => logError(error, 'uncaughtException'));
process.on('error', (error: Error) => logError(error, 'process-error'));
client.on('error', (error: Error) => logError(error, 'client-error'));

// Reminders, dailyMsgs, and punishments loop
setInterval(async () => {
    const now = Date.now();
    const Reminders = (await client.reminders._content.find()).filter(x => now > x.time);
    const Punishments = (await client.punishments._content.find()).filter(x => x.endTime && x.endTime <= now && !x.expired);

    for (const reminder of Reminders) {
    	const embed = new client.embed().setTitle('Reminder').setColor(client.config.embedColor).setDescription(`\`\`\`${reminder.content}\`\`\``);
    	const User = await client.users.fetch(reminder.userid);
    
    	await User.send({ embeds: [embed] }).catch(() => (client.channels.resolve(reminder.ch) as Discord.GuildTextBasedChannel).send({
    		content: User.toString(),
    		embeds: [embed.setFooter({ text: 'Failed to DM' })]
    	}));
    	await client.reminders._content.findByIdAndDelete(reminder._id);
    };

    for (const punishment of Punishments) {
    	client.log(LogColor.Yellow, `${punishment.member.tag}\'s ${punishment.type} (case #${punishment._id}) should expire now`);
    	client.punishments.removePunishment(punishment._id, (client.user as Discord.ClientUser).id, "Time\'s up!").then(result => client.log(LogColor.Yellow, result));
    };
    
    const formattedDate = Math.floor((now - 1667854800000) / 1000 / 60 / 60 / 24);
    const dailyMsgsPath = path.resolve('../databases/dailyMsgs.json');
    const dailyMsgs: number[][] = JSON.parse(fs.readFileSync(dailyMsgsPath, 'utf8'));
    if (!dailyMsgs.some(x => x[0] === formattedDate)) {
        let total = (await client.userLevels._content.find()).reduce((a, b) => a + b.messages, 0); // sum of all users
        const yesterday = dailyMsgs.find(x => x[0] === formattedDate - 1) ?? [formattedDate - 1, 0];
        const channel = client.getChan('general');
        if (total < yesterday[1]) total = yesterday[1]; // messages went down

        dailyMsgs.push([formattedDate, total]);
        fs.writeFileSync(dailyMsgsPath, JSON.stringify(dailyMsgs, null, 4));
        client.log(LogColor.Cyan, `Pushed [${formattedDate}, ${total}] to dailyMsgs`);

        setTimeout(() => {
            client.log(LogColor.Cyan, 'Interval messages');
            const Day = Date().toLowerCase();
        
            if (Day.startsWith('fri')) {
                channel.send('It\'s the weekend! <a:IRT_FrogClap:722536810399662160>');
            } else if (Day.startsWith('sun')) {
                channel.send('Oh no! It\'s Monday... <:IRT_FrogBans:605519995761590273>');
            } else channel.send('<:IRT_RollSee:908055712368853002>');
        }, 7_200_000); // 2 hour timeout, account for time zone differences
    }
}, 5_000);

// Farming Simulator 22 stats loops
if (client.config.botSwitches.FSLoop) setInterval(async () => {
	const watchList = await client.watchList._content.find();
	for await (const server of client.config.FSCacheServers) await FSLoop(client, watchList, server[0], server[1], server[2]);
	FSLoopAll(client, watchList);
}, 30_000);

// YouTube upload nofitcations loop
if (client.config.botSwitches.YTLoop) setInterval(() => client.config.YTCacheChannels.forEach(ch => client.YTLoop(ch[0], ch[1])), 300_000);
