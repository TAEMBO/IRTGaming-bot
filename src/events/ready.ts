import type TClient from '../client.js';
import fs from 'node:fs';
import path from 'node:path';
import { xml2js } from 'xml-js';
import { log, fsLoop, fsLoopAll, FSServers, formatRequestInit } from '../utilities.js';
import type { YTCacheFeed } from '../typings.js';

export default async (client: TClient) => {
    const fsServers = new FSServers(client.config.fs);
    const guild = client.mainGuild();
    const dailyMsgsPath = path.resolve('../databases/dailyMsgs.json');
    const dailyMsgs: [number, number][] = JSON.parse(fs.readFileSync(dailyMsgsPath, 'utf8'));
    const now = Date.now();

    if (client.config.toggles.registerCommands) await guild.commands.set(client.commands.map(x => x.data.toJSON()))
        .then(() => log('Purple', 'Slash commands registered'))
        .catch(e => log('Red', 'Couldn\'t register commands: ', e));

    await guild.members.fetch();
        
    for (const [code, inv] of await guild.invites.fetch()) client.inviteCache.set(code, { uses: inv.uses ?? 0, creator: inv.inviter?.id ?? "UNKNOWN" });

    for (const reminder of await client.reminders.data.find()) client.reminders.setExec(reminder._id, reminder.time < now ? 0 : reminder.time - now);

    for (const punishment of await client.punishments.data.find()) {
        if (!punishment.endTime || punishment.expired) continue;

        client.punishments.setExec(punishment._id, punishment.endTime < now ? 0 : punishment.endTime - now);
    }

    await client.getChan('taesTestingZone').send([
        ':warning: Bot restarted :warning:',
        `<@${client.config.devWhitelist[0]}>`,
        `\`\`\`json\n${JSON.stringify(client.config.toggles, null, 1).slice(1, -1)}\`\`\``
    ].join('\n'));

    log('Blue', `Bot active as ${client.user.tag}`);

    // DailyMsgs loop
    setInterval(async () => {
        const formattedDate = Math.floor((Date.now() - client.config.DAILY_MSGS_TIMESTAMP) / 1000 / 60 / 60 / 24);

        if (dailyMsgs.some(x => x[0] === formattedDate)) return;

        const today = Date().toLowerCase();
        const channel = client.getChan('general');
        const yesterday = dailyMsgs.find(x => x[0] === formattedDate - 1) ?? [formattedDate - 1, 0];
        let total = (await client.userLevels.data.find()).reduce((a, b) => a + b.messages, 0); // sum of all users

        if (total < yesterday[1]) total = yesterday[1]; // messages went down

        dailyMsgs.push([formattedDate, total]);
        fs.writeFileSync(dailyMsgsPath, JSON.stringify(dailyMsgs, null, 4));
        log('Cyan', `Pushed [${formattedDate}, ${total}] to dailyMsgs`);
    
        if (today.startsWith('fri')) {
            await channel.send(`Weekend begins! ${client.config.DAILY_MSGS_WEEKEND}`);
        } else if (today.startsWith('sun')) {
            await channel.send(`It's back to Monday... ${client.config.DAILY_MSGS_MONDAY}`);
        } else await channel.send(client.config.DAILY_MSGS_DEFAULT);
    }, 10_000);

    // Farming Simulator stats loop
    if (client.config.toggles.fsLoop) setInterval(async () => {
	    const watchList = await client.watchList.data.find();

	    for await (const [serverAcro, server] of fsServers.entries()) await fsLoop(client, watchList, server, serverAcro);
	    await fsLoopAll(client, watchList);
    }, 30_000);

    // YouTube upload notifications loop
    if (client.config.toggles.ytLoop) setInterval(async () => {
        for await (const [chanId, chanName] of client.config.ytCacheChannels) {
            const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${chanId}`, formatRequestInit(5_000, "YTLoop")).catch(() => log('Red', `${chanName} YT fail`));
    
            if (!res) continue;
    
            const Data = xml2js(await res.text(), { compact: true }) as YTCacheFeed;
            const latestVid = Data.feed.entry[0];
    
            if (!client.ytCache[chanId]) {
                client.ytCache[chanId] = latestVid['yt:videoId']._text;
                continue;
            }
    
            if (Data.feed.entry[1]['yt:videoId']._text !== client.ytCache[chanId]) continue;
            
            client.ytCache[chanId] = latestVid['yt:videoId']._text;
            client.getChan('videosAndLiveStreams').send(`**${chanName}** just uploaded a new video!\n${latestVid.link._attributes.href}`);
        }
    }, 300_000);
}
