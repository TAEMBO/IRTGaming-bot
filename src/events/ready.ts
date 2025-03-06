import { codeBlock, type EmbedBuilder, Events, InteractionContextType, userMention } from "discord.js";
import cron from "node-cron";
import {
    crunchFarmData,
    connectMongoDB,
    fs22Loop,
    fs25Loop,
    fsLoopAll,
    ytFeed
} from "#actions";
import { Event } from "#structures";
import { fs22Servers, fs25Servers, log } from "#util";

export default new Event({
    name: Events.ClientReady,
    once: true,
    async run(client) {
        const guild = client.mainGuild();

        if (client.config.toggles.debug) setTimeout(() => log("Yellow", "Uptime - 60 seconds"), 60_000);

        if (client.config.toggles.registerCommands) {
            const commands = [
                ...client.chatInputCommands.map(x => {
                    x.data.contexts = [InteractionContextType.Guild];

                    return x.data;
                }),
                ...client.contextMenuCommands.map(x => {
                    x.data.contexts = [InteractionContextType.Guild];

                    return x.data;
                })
            ];

            await client.application.commands.set(commands)
                .then(() => log("Purple", "Application commands registered"))
                .catch(e => log("Red", "Couldn't register commands: ", e));
        } else {
            await client.application.commands.fetch();
        }

        await connectMongoDB(client);

        await guild.members.fetch();

        for (const [code, inv] of await guild.invites.fetch()) client.inviteCache.set(code, {
            uses: inv.uses ?? 0,
            creator: inv.inviter?.id ?? "UNKNOWN"
        });

        log("Blue", "Bot active as", client.user.tag);

        await client.getChan("taesTestingZone").send([
            ":warning: Bot restarted :warning:",
            userMention(client.config.devWhitelist[0]),
            codeBlock("json", JSON.stringify(client.config.toggles, null, 1).slice(1, -1))
        ].join("\n"));

        // Daily jobs
        cron.schedule("0 0 * * *", async (date) => {
            if (typeof date === "string") return;

            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

            const formattedDate = Math.floor((date.getTime() - client.config.DAILY_MSGS_TIMESTAMP) / 1_000 / 60 / 60 / 24);
            const day = date.getUTCDay();
            const channel = client.getChan("general");
            const yesterday = await client.dailyMsgs.data.findById(formattedDate - 1) ?? { _id: formattedDate - 1, count: 0 };
            let total = (await client.userLevels.data.find()).reduce((a, b) => a + b.messages, 0); // sum of all users

            if (total < yesterday.count) total = yesterday.count; // messages went down

            await client.dailyMsgs.data.create({
                _id: formattedDate,
                count: total
            });

            log("Cyan", `Pushed { ${formattedDate}, ${total} } to dailyMsgs`);

            if (client.config.toggles.autoResponses) {
                const dailyMsgsMsg = day === 6
                    ? client.config.DAILY_MSGS_WEEKEND
                    : day === 1
                        ? client.config.DAILY_MSGS_MONDAY
                        : client.config.DAILY_MSGS_DEFAULT;

                await channel.send(dailyMsgsMsg);
            }

            if (client.config.toggles.fs22Loop) {
                for (const [serverAcro, server] of fs22Servers.getCrunchable()) await client.playerTimes22.fetchFarmData(serverAcro, server);
            }

            if (client.config.toggles.fs25Loop) {
                const playerTimes = await client.playerTimes25.data.find();

                for (const [serverAcro] of fs25Servers.getCrunchable()) await crunchFarmData(client, playerTimes, serverAcro);
            }
        }, { timezone: "UTC" });

        // Farming Simulator stats loop
        if (client.config.toggles.fs22Loop || client.config.toggles.fs25Loop) setInterval(async () => {
            const watchList = await client.watchList.data.find();
            const embedBuffer: EmbedBuilder[] = [];

            if (client.config.toggles.fs22Loop) {
                for (const serverAcro of fs22Servers.keys()) await fs22Loop(client, watchList, serverAcro, embedBuffer);
            }

            if (client.config.toggles.fs25Loop) {
                for (const serverAcro of fs25Servers.keys()) await fs25Loop(client, watchList, serverAcro, embedBuffer);
            }

            for (let i = 0; i < embedBuffer.length; i += 10) {
                await client.getChan("fsLogs").send({ embeds: embedBuffer.slice(i, i + 10) });
            }

            await fsLoopAll(client, watchList);
        }, 30_000);

        // YouTube upload notifications feed
        if (client.config.toggles.ytFeed) ytFeed(client);
    }
});