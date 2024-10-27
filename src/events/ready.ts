import { codeBlock, Events, InteractionContextType } from "discord.js";
import cron from "node-cron";
import { connectMongoDB, fsLoop, fsLoopAll, ytLoop } from "#actions";
import { Event } from "#structures";
import { fsServers, log } from "#util";

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

        log("Blue", `Bot active as ${client.user.tag}`);

        await client.getChan("taesTestingZone").send([
            ":warning: Bot restarted :warning:",
            `<@${client.config.devWhitelist[0]}>`,
            codeBlock("json", JSON.stringify(client.config.toggles, null, 1).slice(1, -1))
        ].join("\n"));

        // DailyMsgs schedule
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

            if (!client.config.toggles.autoResponses) return;

            if (day === 6) {
                await channel.send(client.config.DAILY_MSGS_WEEKEND);
            } else if (day === 1) {
                await channel.send(client.config.DAILY_MSGS_MONDAY);
            } else await channel.send(client.config.DAILY_MSGS_DEFAULT);
        }, { timezone: "UTC" });

        // Farming Simulator stats loop
        if (client.config.toggles.fsLoop) setInterval(async () => {
            const watchList = await client.watchList.data.find();

            for (const [serverAcro, server] of fsServers.entries()) await fsLoop(client, watchList, server, serverAcro);
            await fsLoopAll(client, watchList);
        }, 30_000);

        // YouTube upload notifications loop
        if (client.config.toggles.ytLoop) setInterval(ytLoop.bind(client), 1_800_000);
    }
});