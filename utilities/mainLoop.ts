import Discord from 'discord.js';
import YClient from '../client.js';
import fs from 'node:fs';
import path from 'node:path';
import { log } from '../utilities.js';
import { LogColor } from '../typings.js';

/** Reminders, dailyMsgs, and punishments loop */
export async function mainLoop(client: YClient) {
    const now = Date.now();
    const Reminders = (await client.reminders._content.find()).filter(x => now > x.time);
    const Punishments = (await client.punishments._content.find()).filter(x => x.endTime && x.endTime <= now && !x.expired);

    for (const reminder of Reminders) {
    	const embed = new client.embed().setTitle('Reminder').setColor(client.config.embedColor).setDescription(`\`\`\`${reminder.content}\`\`\``);
    
        client.users.send(reminder.userid, {embeds: [embed]}).catch(() => (client.channels.resolve(reminder.ch) as Discord.GuildTextBasedChannel).send({
    		content: `Reminder <@${reminder.userid}>`,
    		embeds: [embed.setFooter({ text: 'Failed to DM' })]
    	}));
    	await client.reminders._content.findByIdAndDelete(reminder._id);
    };

    for (const punishment of Punishments) {
    	log(LogColor.Yellow, `${punishment.member.tag}\'s ${punishment.type} (case #${punishment._id}) should expire now`);
    	client.punishments.removePunishment(punishment._id, (client.user as Discord.ClientUser).id, "Time\'s up!").then(result => log(LogColor.Yellow, result));
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

            const Day = Date().toLowerCase();
            const channel = client.getChan('general');
        
            if (Day.startsWith('fri')) {
                channel.send('It\'s the weekend! <a:IRT_FrogClap:722536810399662160>');
            } else if (Day.startsWith('sun')) {
                channel.send('Oh no! It\'s Monday... <:IRT_FrogBans:605519995761590273>');
            } else channel.send('<:IRT_RollSee:908055712368853002>');
        }, 7_200_000); // 2 hour timeout, account for time zone differences
    }
}