import { Events } from "discord.js";
import mongoose from "mongoose";
import cron from "node-cron";
import { Event } from "#structures";
import { fsLoop, fsLoopAll } from "#actions";
import { formatRequestInit, fsServers, jsonFromXML, log } from "#util";
import type { YTCacheFeed } from "#typings";

export default new Event({
    name: Events.ClientReady,
    once: true,
    async run(client) {
        const guild = client.mainGuild();
        const now = Date.now();

        if (client.config.toggles.debug) setTimeout(() => log("Yellow", "Uptime - 60 seconds"), 60_000);
    
        await mongoose.set("strictQuery", true).connect(client.config.MONGO_URI, {
            autoIndex: true,
            serverSelectionTimeoutMS: 5_000,
            socketTimeoutMS: 45_000,
            family: 4,
            waitQueueTimeoutMS: 50_000
        }).then(() => log("Purple", "Connected to MongoDB"));
    
        if (client.config.toggles.registerCommands) {
            await client.application.commands.set([
                ...client.chatInputCommands.map(x => x.data),
                ...client.contextMenuCommands.map(x => x.data)
            ])
                .then(() => log("Purple", "Application commands registered"))
                .catch(e => log("Red", "Couldn't register commands: ", e));
        } else {
            await client.application.commands.fetch();
        }

        await Promise.allSettled([
            guild.members.fetch(),
            client.bannedWords.fillCache(),
            client.fmList.fillCache(),
            client.tfList.fillCache(),
            client.watchListPings.fillCache(),
            client.whitelist.fillCache()
        ]);

        for (const [code, inv] of await guild.invites.fetch()) client.inviteCache.set(code, {
            uses: inv.uses ?? 0,
            creator: inv.inviter?.id ?? "UNKNOWN"
        });
    
        for (const reminder of await client.reminders.data.find()) client.reminders.setExec(reminder._id, reminder.time < now
            ? 0
            : reminder.time - now
        );
    
        for (const punishment of await client.punishments.data.find()) {
            if (!punishment.endTime || punishment.expired) continue;
    
            client.punishments.setExec(punishment._id, punishment.endTime < now
                ? 0
                : punishment.endTime - now
            );
        }
    
        await client.getChan("taesTestingZone").send([
            ":warning: Bot restarted :warning:",
            `<@${client.config.devWhitelist[0]}>`,
            `\`\`\`json\n${JSON.stringify(client.config.toggles, null, 1).slice(1, -1)}\`\`\``
        ].join("\n"));
    
        log("Blue", `Bot active as ${client.user.tag}`);
    
        // DailyMsgs schedule
        cron.schedule("0 0 * * *", async (date) => {
            if (typeof date === "string") return;

            const formattedDate = Math.floor((Date.now() - client.config.DAILY_MSGS_TIMESTAMP) / 1000 / 60 / 60 / 24);
            const day = date.getDay();
            const channel = client.getChan("general");
            const yesterday = await client.dailyMsgs.data.findById(formattedDate - 1) ?? { _id: formattedDate - 1, count: 0 };
            let total = (await client.userLevels.data.find()).reduce((a, b) => a + b.messages, 0); // sum of all users
    
            if (total < yesterday.count) total = yesterday.count; // messages went down
    
            await client.dailyMsgs.data.create({
                _id: formattedDate,
                count: total
            });
            log("Cyan", `Pushed { ${formattedDate}, ${total} } to dailyMsgs`);

            if (!client.config.toggles.autoResponses) return;
        
            if (day === 6) {
                await channel.send(client.config.DAILY_MSGS_WEEKEND);
            } else if (day === 1) {
                await channel.send(client.config.DAILY_MSGS_MONDAY);
            } else await channel.send(client.config.DAILY_MSGS_DEFAULT);
        }, { timezone: "UCT" });

        // Farming Simulator stats loop
        if (client.config.toggles.fsLoop) setInterval(async () => {
            const watchList = await client.watchList.data.find();
    
            for (const [serverAcro, server] of fsServers.entries()) await fsLoop(client, watchList, server, serverAcro);
            await fsLoopAll(client, watchList);
        }, 30_000);
    
        // YouTube upload notifications loop
        if (client.config.toggles.ytLoop) setInterval(async () => {
            for (const channel of client.config.ytChannels) {
                if (client.config.toggles.debug) log("Yellow", "YTLoop", channel.name);

                const res = await fetch(
                    `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`,
                    formatRequestInit(5_000, "YTLoop")
                ).catch(() => log("Red", `${channel.name} YT fetch fail`));
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
        }, 1_800_000);
    }
});