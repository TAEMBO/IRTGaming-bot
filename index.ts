import Discord, { EmbedBuilder } from 'discord.js';
import YClient from './client.js';
import fs from 'node:fs';
import path from 'node:path';
import { log, YTLoop, FSLoop, FSLoopAll } from './utilities.js';
import { LogColor, ServerAcroList } from './typings.js';

const client = new YClient();

console.log(client.config.botSwitches);
console.log(client.config.devWhitelist);

/** Error handler */
function errorLog(error: Error, event: string) {
    if (['Request aborted', 'getaddrinfo ENOTFOUND discord.com'].includes(error.message) || !client.isReady()) return;

    const dirname = process.cwd().replaceAll('\\', '/');

    client.getChan('taesTestingZone').send({
        content: `<@${client.config.devWhitelist[0]}>`,
        embeds: [new EmbedBuilder()
            .setTitle(`Error Caught - ${error.message.slice(0, 240)}`)
            .setColor("#420420")
            .setDescription(`\`\`\`ansi\n${error.stack?.replaceAll(' at ', ' [31mat[37m ').replaceAll(dirname, `[33m${dirname}[37m`).slice(0, 2500)}\`\`\``)
            .setTimestamp()
            .setFooter({ text: event })
        ]
    });
}

process.on('unhandledRejection', (error: Error) => errorLog(error, 'unhandledRejection'));
process.on('uncaughtException', error => errorLog(error, 'uncaughtException'));
process.on('error', error => errorLog(error, 'process-error'));
client.on('error', error => errorLog(error, 'client-error'));

// Reminders, dailyMsgs, and punishments loop
setInterval(async () => {
    const now = Date.now();
    const Reminders = (await client.reminders._content.find()).filter(x => now > x.time);
    const Punishments = (await client.punishments._content.find()).filter(x => x.endTime && x.endTime <= now && !x.expired);

    for (const reminder of Reminders) {
    	const embed = new EmbedBuilder().setTitle('Reminder').setColor(client.config.embedColor).setDescription(`\`\`\`${reminder.content}\`\`\``);
    
        client.users.send(reminder.userid, { embeds: [embed] }).catch(() => (client.channels.resolve(reminder.ch) as Discord.GuildTextBasedChannel).send({
    		content: `Reminder <@${reminder.userid}>`,
    		embeds: [embed.setFooter({ text: 'Failed to DM' })]
    	}));
    	await client.reminders._content.findByIdAndDelete(reminder._id);
    };

    for (const punishment of Punishments) {
    	log(LogColor.Yellow, `${punishment.member.tag}\'s ${punishment.type} (case #${punishment._id}) should expire now`);
    	client.punishments.removePunishment(punishment._id, client.user?.id as string, "Time\'s up!").then(result => log(LogColor.Yellow, result));
    };
    
    const formattedDate = Math.floor((now - 1667854800000) / 1000 / 60 / 60 / 24);
    const dailyMsgsPath = path.resolve('../databases/dailyMsgs.json');
    const dailyMsgs: number[][] = JSON.parse(fs.readFileSync(dailyMsgsPath, 'utf8'));

    if (!dailyMsgs.some(x => x[0] === formattedDate)) {
        const yesterday = dailyMsgs.find(x => x[0] === formattedDate - 1) ?? [formattedDate - 1, 0];
        let total = (await client.userLevels._content.find()).reduce((a, b) => a + b.messages, 0); // sum of all users

        if (total < yesterday[1]) total = yesterday[1]; // messages went down

        dailyMsgs.push([formattedDate, total]);
        fs.writeFileSync(dailyMsgsPath, JSON.stringify(dailyMsgs, null, 4));
        log(LogColor.Cyan, `Pushed [${formattedDate}, ${total}] to dailyMsgs`);

        setTimeout(() => {
            log(LogColor.Cyan, 'Interval messages');

            const today = Date().toLowerCase();
            const channel = client.getChan('general');
        
            if (today.startsWith('fri')) {
                channel.send('It\'s the weekend! <a:IRT_FrogClap:722536810399662160>');
            } else if (today.startsWith('sun')) {
                channel.send('Oh no! It\'s Monday... <:IRT_FrogBans:605519995761590273>');
            } else channel.send('<:IRT_RollSee:908055712368853002>');
        }, 7_200_000); // 2 hour timeout, account for time zone differences
    }
}, 5_000);

// Farming Simulator stats loop
if (client.config.botSwitches.FSLoop) setInterval(async () => {
	const watchList = await client.watchList._content.find();

	for await (const [serverAcro, server] of Object.entries(client.config.fs)) await FSLoop(client, watchList, server.channelId, server.messageId, serverAcro as ServerAcroList);
	FSLoopAll(client, watchList);
}, 30_000);

// YouTube upload nofitcations loop
if (client.config.botSwitches.YTLoop) setInterval(() => client.config.YTCacheChannels.forEach(ch => YTLoop(client, ch[0], ch[1])), 300_000);
