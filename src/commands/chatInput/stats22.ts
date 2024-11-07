import { ApplicationCommandOptionType, AttachmentBuilder, EmbedBuilder } from "discord.js";
import canvas from "@napi-rs/canvas";
import { DSSExtension, type DSSResponse, Feeds, filterUnused } from "farming-simulator-types/2022";
import { Command } from "#structures";
import {
    ADMIN_ICON,
    FM_ICON,
    TF_ICON,
    WL_ICON,
    formatRequestInit,
    formatTime,
    fs22Servers,
    isMPStaff,
    log
} from "#util";

export default new Command<"chatInput">({
    async autocomplete(interaction) {
        switch (interaction.options.getSubcommand()) {
            case "playertimes": {
                const playerData = await interaction.client.playerTimes22.data.find();
                const focused = interaction.options.getFocused().toLowerCase().replace(" ", "");
                const choices = playerData
                    .filter(x => x._id.toLowerCase().replace(" ", "").startsWith(focused))
                    .map(x => ({ name: x._id, value: x._id }))
                    .slice(0, 24);

                await interaction.respond(choices);

                break;
            };
        }
    },
    async run(interaction) {
        const subCmd = interaction.options.getSubcommand();

        if ((
            interaction.channel!.parentId === interaction.client.config.mainServer.categories.fs22PublicMP
            || interaction.channelId === interaction.client.config.mainServer.channels.mfPublicChat
        ) && !isMPStaff(interaction.member)) return await interaction.reply({
            content: [
                `This command has [restrictions](${interaction.client.config.resources.statsRestrictionRedirect}) set`,
                ` please use <#${interaction.client.config.mainServer.channels.botCommands}> for ${interaction.client.getCommandMention("stats")} commands.`
            ].join(),
            ephemeral: true
        });

        if (subCmd === "all") {
            await interaction.deferReply();

            const embed = new EmbedBuilder().setColor(interaction.client.config.EMBED_COLOR);
            const failedFooter: string[] = [];
            const totalUsedCount: number[] = [];
            const watchList = await interaction.client.watchList.data.find();

            await Promise.allSettled(fs22Servers.entries().map(async ([serverAcro, server]) => {
                const serverAcroUp = serverAcro.toUpperCase();
                let dss: DSSResponse;

                try {
                    const res = await fetch(
                        server.url + Feeds.dedicatedServerStats(server.code, DSSExtension.JSON),
                        formatRequestInit(4_000, "StatsAll")
                    );

                    dss = await res.json();
                } catch (err) {
                    log("Red", `Stats all ${serverAcroUp};`, err);

                    return void failedFooter.push(`Failed to fetch ${serverAcroUp}`);
                }

                if (!dss.slots) return;

                if (!dss.server.name) return void failedFooter.push(`${serverAcroUp} offline`);

                if (!dss.slots.used) return;

                totalUsedCount.push(dss.slots.used);

                const playerInfo: string[] = [];
                const serverSlots = `${dss.slots.used}/${dss.slots.capacity}`;

                for (const player of filterUnused(dss.slots.players)) {
                    const playTimeHrs = Math.floor(player.uptime / 60);
                    const playTimeMins = (player.uptime % 60).toString().padStart(2, "0");
                    const inWl = watchList.some(x => x._id === player.name);
                    let decorators = player.isAdmin ? ADMIN_ICON : "";
                    decorators += interaction.client.fmList.cache.includes(player.name) ? FM_ICON : "";
                    decorators += interaction.client.tfList.cache.includes(player.name) ? TF_ICON : "";
                    decorators += inWl ? WL_ICON : "";

                    playerInfo.push(`\`${player.name}\` ${decorators} **|** ${playTimeHrs}:${playTimeMins}`);
                }

                embed.addFields({ name: `${server.fullName} - ${serverSlots}`, value: playerInfo.join("\n"), inline: true });
            }));

            embed
                .setTitle(`All Servers: ${totalUsedCount.reduce((a, b) => a + b, 0)} players online`)
                .setFooter(failedFooter.length ? { text: failedFooter.join(", ") } : null);

            await interaction.editReply({ embeds: [embed] });
        } else if (subCmd === "playertimes") {
            const { getTimeData, doc } = interaction.client.playerTimes22;
            const playersData = await interaction.client.playerTimes22.data.find();
            const sortedPlayersData = playersData.sort((a, b) =>
                getTimeData(b).reduce((x, y) => x + y[1].time, 0) - getTimeData(a).reduce((x, y) => x + y[1].time, 0)
            );
            const player = interaction.options.getString("name");
            const leaderboard = (data: (typeof doc)[], isFirstField: boolean) => data.map((playerData, i) => [
                `**${i + (isFirstField ? 1 : 26)}.** \`${playerData._id}\``,
                interaction.client.fmList.cache.includes(playerData._id) ? FM_ICON : "",
                interaction.client.tfList.cache.includes(playerData._id) ? TF_ICON : "",
                " - ",
                formatTime((getTimeData(playerData).reduce((x, y) => x + y[1].time, 0) * 60 * 1_000), 3, { commas: true })
            ].join("")).join("\n");

            if (!player) {
                return await interaction.reply({ embeds: [new EmbedBuilder()
                    .setColor(interaction.client.config.EMBED_COLOR)
                    .setDescription(`Top 50 players with the most time spent on IRTGaming FS22 servers since ${interaction.client.config.PLAYERTIMES_START_DATE}`)
                    .addFields(
                        { name: "\u200b", value: leaderboard(sortedPlayersData.slice(0, 25), true), inline: true },
                        { name: "\u200b", value: leaderboard(sortedPlayersData.slice(25, 50), false) + "\u200b", inline: true })
                ] });
            }

            const playerData = playersData.find(x => x._id === player);

            if (!playerData) return await interaction.reply(`No data found with that name. [Find out why.](${interaction.client.config.resources.statsNoDataRedirect})`);

            const fsKeys = fs22Servers.keys();
            const playerTimeData = getTimeData(playerData).sort((a, b) => fsKeys.indexOf(a[0]) - fsKeys.indexOf(b[0]));
            const playerTimeDataTotal = playerTimeData.reduce((x, y) => x + y[1].time, 0);
            const formattedTimeData = playerTimeData
                .filter(x => interaction.client.fs22Cache[x[0]])
                .map(([serverAcro, timeData]) => ({
                    name: serverAcro.toUpperCase(),
                    value: [
                        `Time - ${formatTime(timeData.time * 60 * 1000, 5, { commas: true })}`,
                        `Last on - ${interaction.client.fs22Cache[serverAcro].players.some(x => x.name === playerData._id) ? "Right now" : `<t:${timeData.lastOn}:R>`}`
                    ].join("\n")
                }));

            await interaction.reply({ embeds: [new EmbedBuilder()
                .setColor(interaction.client.config.EMBED_COLOR)
                .setTitle([
                    `Player - \`${playerData._id}\`${interaction.client.fmList.cache.includes(playerData._id) ? FM_ICON : ""}${interaction.client.tfList.cache.includes(playerData._id) ? TF_ICON : ""}`,
                    `Leaderboard position - **#${sortedPlayersData.indexOf(playerData) + 1}**`,
                    `Total time - **${formatTime(playerTimeDataTotal * 60 * 1000, 5, { commas: true })}**`,
                    (isMPStaff(interaction.member) && playerData.uuid) ? `UUID: \`${playerData.uuid}\`` : "",
                    (isMPStaff(interaction.member) && playerData.discordid) ? `Discord user ID - \`${playerData.discordid}\`` : "",
                ].join("\n"))
                .setFields(formattedTimeData)
            ] });
        } else {
            const server = interaction.client.config.fs22[subCmd];
            const dss = await fetch(server.url + Feeds.dedicatedServerStats(server.code, DSSExtension.JSON), formatRequestInit(2_000, "Stats"))
                .then(res => res.json() as Promise<DSSResponse>)
                .catch(() => log("Red", `Stats ${subCmd.toUpperCase()} failed`));

            if (!dss || !dss.slots) return await interaction.reply("Server did not respond");

            const data = interaction.client.fs22Cache[subCmd].graphPoints;

            // handle negative days
            for (const [i, change] of data.entries()) if (change < 0) data[i] = data[i - 1] || data[i + 1] || 0;

            const firstGraphTop = 16;
            const secondGraphTop = 16;
            const textSize = 40;
            const img = canvas.createCanvas(1500, 750);
            const ctx = img.getContext("2d");
            const graphOrigin = [15, 65];
            const graphSize = [1275, 630];
            const nodeWidth = graphSize[0] / (data.length - 1);

            ctx.fillStyle = "#36393f";
            ctx.fillRect(0, 0, img.width, img.height);

            // grey horizontal lines
            ctx.lineWidth = 5;

            const intervalCandidates: [number, number, number][] = [];

            for (let i = 4; i < 10; i++) {
                const interval = firstGraphTop / i;

                if (Number.isInteger(interval)) {
                    const intervalString = interval.toString();
                    const referenceNumber = i * Math.max(intervalString.split("").filter(x => x === "0").length / intervalString.length, 0.3) * (["1", "2", "4", "5", "6", "8"].includes(intervalString[0]) ? 1.5 : 0.67);

                    intervalCandidates.push([interval, i, referenceNumber]);
                }
            }

            const chosenInterval = intervalCandidates.sort((a, b) => b[2] - a[2])[0];
            const previousY: number[] = [];

            ctx.strokeStyle = "#202225";

            for (let i = 0; i <= chosenInterval[1]; i++) {
                const y = graphOrigin[1] + graphSize[1] - (i * (chosenInterval[0] / secondGraphTop) * graphSize[1]);

                if (y < graphOrigin[1]) continue;

                const even = ((i + 1) % 2) === 0;

                if (even) ctx.strokeStyle = "#2c2f33";

                ctx.beginPath();
                ctx.lineTo(graphOrigin[0], y);
                ctx.lineTo(graphOrigin[0] + graphSize[0], y);
                ctx.stroke();
                ctx.closePath();

                if (even) ctx.strokeStyle = "#202225";

                previousY.push(y, i * chosenInterval[0]);
            }

            // 30d mark
            ctx.setLineDash([8, 16]);
            ctx.beginPath();

            const lastMonthStart = graphOrigin[0] + (nodeWidth * (data.length - 60));

            ctx.lineTo(lastMonthStart, graphOrigin[1]);
            ctx.lineTo(lastMonthStart, graphOrigin[1] + graphSize[1]);
            ctx.stroke();
            ctx.closePath();
            ctx.setLineDash([]);

            // draw points
            ctx.lineWidth = 5;

            const gradient = ctx.createLinearGradient(0, graphOrigin[1], 0, graphOrigin[1] + graphSize[1]);

            gradient.addColorStop(1 / 16, interaction.client.config.EMBED_COLOR_RED);
            gradient.addColorStop(5 / 16, interaction.client.config.EMBED_COLOR_YELLOW);
            gradient.addColorStop(12 / 16, interaction.client.config.EMBED_COLOR_GREEN);

            let lastCoords: number[] = [];

            for (const [i, cur /* current player count */] of data.entries()) {
                let curPC = cur;
                if (curPC < 0) curPC = 0;

                const x = i * nodeWidth + graphOrigin[0];
                const y = ((1 - (curPC / secondGraphTop)) * graphSize[1]) + graphOrigin[1];
                const nexPC /* next player count */ = data[i + 1];
                const prvPC /* previous player count */ = data[i - 1];

                ctx.strokeStyle = gradient;
                ctx.beginPath();

                if (lastCoords.length) ctx.moveTo(lastCoords[0], lastCoords[1]);

                // if the line being drawn is horizontal, make it go until it has to go down
                if (y === lastCoords[1]) {
                    let newX = x;

                    for (let j = i + 1; j <= data.length; j++) {
                        if (data[j] === curPC) {
                            newX += nodeWidth;
                        } else break;
                    }

                    ctx.lineTo(newX, y);
                } else ctx.lineTo(x, y);

                lastCoords = [x, y];
                ctx.stroke();
                ctx.closePath();

                if (curPC !== prvPC || curPC !== nexPC) { // Ball if vertical different to next or prev point
                    // ball
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(x, y, ctx.lineWidth * 1.3, 0, 2 * Math.PI);
                    ctx.closePath();
                    ctx.fill();
                }
            }

            // draw text
            ctx.font = "400 " + textSize + "px DejaVu Sans";
            ctx.fillStyle = "white";

            // highest value
            if (!isNaN(previousY.at(-2)!)) {
                const maxx = graphOrigin[0] + graphSize[0] + textSize / 2;
                const maxy = (previousY.at(-2)!) + (textSize / 3);

                ctx.fillText((previousY.at(-1)!).toLocaleString("en-US"), maxx, maxy);
            }

            // lowest value
            const lowx = graphOrigin[0] + graphSize[0] + textSize / 2;
            const lowy = graphOrigin[1] + graphSize[1] + (textSize / 3);

            ctx.fillText("0 players", lowx, lowy);

            // 30d
            ctx.fillText("30 min ago", lastMonthStart, graphOrigin[1] - (textSize / 2));

            // time ->
            const tx = graphOrigin[0] + (textSize / 2);
            const ty = graphOrigin[1] + graphSize[1] + (textSize);

            ctx.fillText("time ->", tx, ty);

            const playerInfo: string[] = [];
            const watchList = await interaction.client.watchList.data.find();
            const players = filterUnused(dss.slots.players);

            for (const player of players) {
                const playTimeHrs = Math.floor(player.uptime / 60);
                const playTimeMins = (player.uptime % 60).toString().padStart(2, "0");
                const inWl = watchList.some(x => x._id === player.name);
                let decorators = player.isAdmin ? ADMIN_ICON : "";

                decorators += interaction.client.fmList.cache.includes(player.name) ? FM_ICON : "";
                decorators += interaction.client.tfList.cache.includes(player.name) ? TF_ICON : "";
                decorators += inWl ? WL_ICON : "";

                playerInfo.push(`\`${player.name}\` ${decorators} **|** ${playTimeHrs}:${playTimeMins}`);
            }

            const serverSlots = `${dss.slots.used}/${dss.slots.capacity}`;
            const serverTimeHrs = Math.floor(dss.server.dayTime / 3600 / 1000).toString().padStart(2, "0");
            const serverTimeMins = Math.floor((dss.server.dayTime / 60 / 1000) % 60).toString().padStart(2, "0");
            const embed = new EmbedBuilder()
                .setAuthor({ name: `${serverSlots} - ${serverTimeHrs}:${serverTimeMins}` })
                .setTitle(dss.server.name || "Offline")
                .setDescription(dss.slots.used ? playerInfo.join("\n"): "*No players online*")
                .setImage("attachment://FSStats.png")
                .setColor(dss.slots.used === dss.slots.capacity
                    ? interaction.client.config.EMBED_COLOR_RED
                    : dss.slots.used > (dss.slots.capacity / 2)
                        ? interaction.client.config.EMBED_COLOR_YELLOW
                        : interaction.client.config.EMBED_COLOR_GREEN
                );

            if (!players.some(x => x.isAdmin) && interaction.client.fs22Cache[subCmd].lastAdmin) embed
                .setTimestamp(interaction.client.fs22Cache[subCmd].lastAdmin)
                .setFooter({ text: "Admin last on" });

            await interaction.reply({ embeds: [embed], files: [new AttachmentBuilder(img.toBuffer("image/png"), { name: "FSStats.png" })] });
        }
    },
    data: {
        name: "stats-22",
        description: "Get info on an FS server",
        options: [
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "all",
                description: "Get info on all servers",
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "playertimes",
                description: "Player time data",
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "name",
                        description: "The in-game name of the player to get stats for",
                        autocomplete: true,
                        required: false
                    }
                ]
            },
            ...fs22Servers.entries().map(([serverAcro, { fullName }]) => ({
                type: ApplicationCommandOptionType.Subcommand,
                name: serverAcro,
                description: `${fullName} server stats`
            }) as const)
        ]
    }
});
