import Discord, { EmbedBuilder } from 'discord.js';
import YClient from '../client.js';
import fs from 'node:fs';
import path from 'node:path';
import { xml2js } from 'xml-js';
import { log, FSLoop, FSLoopAll } from '../utilities.js';
import { YTCacheFeed } from '../typings.js';

export default async (client: YClient) => {
    const guild = client.mainGuild();

    if (client.config.botSwitches.registerCommands) guild.commands.set(client.registry)
        .then(() => log('Purple', 'Slash commands registered'))
        .catch(e => log('Red', 'Couldn\'t register commands: ', e));
        
    for (const [code, inv] of await guild.invites.fetch()) client.invites.set(code, { uses: inv.uses, creator: inv.inviter?.id });

    await client.getChan('taesTestingZone').send([
        ':warning: Bot restarted :warning:',
        `<@${client.config.devWhitelist[0]}>`,
        `\`\`\`json\n${JSON.stringify(client.config.botSwitches, null, 1).slice(1, -1)}\`\`\``
    ].join('\n'));

    log('Blue', `Bot active as ${client.user?.tag}`);

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
        	log('Yellow', `${punishment.member.tag}\'s ${punishment.type} (case #${punishment._id}) should expire now`);
        	client.punishments.removePunishment(punishment._id, client.user?.id as string, "Time\'s up!").then(result => log('Yellow', result));
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
            log('Cyan', `Pushed [${formattedDate}, ${total}] to dailyMsgs`);

            setTimeout(() => {
                log('Cyan', 'Interval messages');

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
    if (client.config.botSwitches.fsLoop) setInterval(async () => {
	    const watchList = await client.watchList._content.find();

	    for await (const [serverAcro, server] of Object.entries(client.config.fs)) await FSLoop(client, watchList, server.channelId, server.messageId, serverAcro);
	    FSLoopAll(client, watchList);
    }, 30_000);

    // YouTube upload nofitcations loop
    if (client.config.botSwitches.ytLoop) setInterval(async () => {
        for await (const [chanId, chanName] of client.config.ytCacheChannels) {
            const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${chanId}`, {
                signal: AbortSignal.timeout(5000)
            }).catch(() => log('Red', `${chanName} YT fail`));
    
            if (!res) return;
    
            const Data = xml2js(await res.text(), { compact: true }) as YTCacheFeed;
            const latestVid = Data.feed.entry[0];
    
            if (!client.ytCache[chanId]) return client.ytCache[chanId] = latestVid['yt:videoId']._text;
    
            if (Data.feed.entry[1]['yt:videoId']._text === client.ytCache[chanId]) {
                client.ytCache[chanId] = latestVid['yt:videoId']._text;
                client.getChan('videosAndLiveStreams').send(`**${chanName}** just uploaded a new video!\n${latestVid.link._attributes.href}`);
            }
        }
    }, 300_000);
}
