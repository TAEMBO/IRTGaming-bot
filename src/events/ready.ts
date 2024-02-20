import type TClient from "../client.js";
import mongoose from "mongoose";
import { FSServers } from "../structures/index.js";
import { formatRequestInit, fsLoop, fsLoopAll, jsonFromXML, log } from "../util/index.js";
import type { YTCacheFeed } from "../typings.js";

export default async (client: TClient) => {
    const fsServers = new FSServers(client.config.fs);
    const guild = client.mainGuild();
    const now = Date.now();

    await mongoose.set("strictQuery", true).connect(client.config.MONGO_URI, {
        autoIndex: true,
        serverSelectionTimeoutMS: 5_000,
        socketTimeoutMS: 45_000,
        family: 4,
        waitQueueTimeoutMS: 50_000
    }).then(() => log("Purple", "Connected to MongoDB"));

    if (client.config.toggles.registerCommands) {
        await client.application.commands.set([
            ...client.chatInputCommands.map(x => x.data.toJSON()),
            ...client.contextMenuCommands.map(x => x.data.toJSON())
        ])
            .then(() => log("Purple", "Application commands registered"))
            .catch(e => log("Red", "Couldn\"t register commands: ", e));
    } else {
        await client.application.commands.fetch();
    }

    await guild.members.fetch();

    await client.dailyMsgs.fillCache();
        
    for (const [code, inv] of await guild.invites.fetch()) client.inviteCache.set(code, { uses: inv.uses ?? 0, creator: inv.inviter?.id ?? "UNKNOWN" });

    for (const reminder of await client.reminders.data.find()) client.reminders.setExec(reminder._id, reminder.time < now ? 0 : reminder.time - now);

    for (const punishment of await client.punishments.data.find()) {
        if (!punishment.endTime || punishment.expired) continue;

        client.punishments.setExec(punishment._id, punishment.endTime < now ? 0 : punishment.endTime - now);
    }

    await client.getChan("taesTestingZone").send([
        ":warning: Bot restarted :warning:",
        `<@${client.config.devWhitelist[0]}>`,
        `\`\`\`json\n${JSON.stringify(client.config.toggles, null, 1).slice(1, -1)}\`\`\``
    ].join("\n"));

    log("Blue", `Bot active as ${client.user.tag}`);

    // DailyMsgs loop
    setInterval(async () => {
        const formattedDate = Math.floor((Date.now() - client.config.DAILY_MSGS_TIMESTAMP) / 1000 / 60 / 60 / 24);

        if (client.dailyMsgs.cache.some(x => x._id === formattedDate)) return;

        const today = Date().toLowerCase();
        const channel = client.getChan("general");
        const yesterday = client.dailyMsgs.cache.find(x => x._id === formattedDate - 1) ?? { day: formattedDate - 1, count: 0 };
        let total = (await client.userLevels.data.find()).reduce((a, b) => a + b.messages, 0); // sum of all users

        if (total < yesterday.count) total = yesterday.count; // messages went down

        await client.dailyMsgs.increment({
            _id: formattedDate,
            count: total
        });
        log("Cyan", `Pushed { ${formattedDate}, ${total} } to dailyMsgs`);
    
        if (today.startsWith("fri")) {
            await channel.send(`Weekend begins! ${client.config.DAILY_MSGS_WEEKEND}`);
        } else if (today.startsWith("sun")) {
            await channel.send(`It"s back to Monday... ${client.config.DAILY_MSGS_MONDAY}`);
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
        for await (const channel of client.config.ytChannels) {
            const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`, formatRequestInit(5_000, "YTLoop")).catch(() => log("Red", `${channel.name} YT fetch fail`));
            let data;
    
            if (!res) continue;

            try {
                data = jsonFromXML<YTCacheFeed>(await res.text());
            } catch (err) {
                log("Red", `${channel.name} YT parse fail`);
                continue;
            }

            const latestVid = data.feed.entry[0];
    
            if (!client.ytCache[channel.id]) {
                client.ytCache[channel.id] = latestVid["yt:videoId"]._text;
                continue;
            }
    
            if (data.feed.entry[1]["yt:videoId"]._text !== client.ytCache[channel.id]) continue;
            
            client.ytCache[channel.id] = latestVid["yt:videoId"]._text;
            await client.getChan("videosAndLiveStreams").send(`**${channel.name}** just uploaded a new video!\n${latestVid.link._attributes.href}`);
        }
    }, 300_000);
};
