import { ChannelType, EmbedBuilder, time, userMention } from "discord.js";
import type TClient from "../client.js";
import {
    DSSExtension,
    DSSFile,
    type DSSResponse,
    Feeds,
    filterUnused,
    type PlayerUsed
} from "farming-simulator-types/2025";
import { constants } from "http2";
import {
    ADMIN_ICON,
    FM_ICON,
    TF_ICON,
    WL_ICON,
    formatRequestInit,
    formatTime,
    formatUptime,
    fs25Servers,
    jsonFromXML,
    log
} from "#util";
import type { FSLoopCSG } from "#typings";

export async function fs25Loop(client: TClient, watchList: TClient["watchList"]["doc"][], serverAcro: string, embedBuffer: EmbedBuilder[]) {
    if (client.config.toggles.debug) log("Yellow", "FS25Loop", serverAcro);

    function getDecorators(player: PlayerUsed, isStatsEmbed = false) {
        let decorators = player.isAdmin ? ADMIN_ICON : "";

        decorators += client.fmList.cache.includes(player.name) ? FM_ICON : "";
        decorators += client.tfList.cache.includes(player.name) ? TF_ICON : "";

        if (!isStatsEmbed) {
            decorators += client.whitelist.cache.includes(player.name) ? ":white_circle:" : "";
            decorators += watchList?.some(x => x._id === player.name) ? WL_ICON : "";
        }

        return decorators;
    }

    let justStarted = false;
    let justStopped = false;
    const serverAcroUp = serverAcro.toUpperCase();
    const now = Math.round(Date.now() / 1_000);
    const timestamp = time(new Date(), "t");
    const fsCacheData: Readonly<typeof client.fs25Cache[string]> = structuredClone(client.fs25Cache[serverAcro]);
    const server = fs25Servers.getOne(serverAcro);
    const init = formatRequestInit(7_000, "FSLoop");
    const wlChannel = client.getChan("watchList");
    const serverStatusEmbed = (status: string) => new EmbedBuilder()
        .setTitle(`${serverAcroUp} now ${status}`)
        .setColor(client.config.EMBED_COLOR_YELLOW)
        .setTimestamp();
    const statsMsgEdit = async (embed: EmbedBuilder, completeRes = true) => {
        const channel = client.channels.cache.get(server.channelId);

        client.fs25Cache[serverAcro].completeRes = completeRes;

        if (channel?.type !== ChannelType.GuildText) return log("Red", `FSLoop ${serverAcroUp} invalid channel`);

        await channel.messages.edit(server.messageId, { embeds: [embed] }).catch(() => log("Red", `FSLoop ${serverAcroUp} invalid msg`));
    };

    // Fetch dedicated-server-stats.json and parse
    const dss = await (async () => {
        const res = await fetch(server.url + Feeds.dedicatedServerStats(server.code, DSSExtension.JSON), init)
            .catch(err => log("Red", `${serverAcroUp} DSS ${err.message}`));

        if (!res) return null;

        const data: DSSResponse = await res.json();

        if (!data.slots) return null;

        return data;
    })();

    // Fetch dedicated-server-savegame.html and parse if DSS was successful
    const csg = await (async () => {
        if (!dss) return null;

        const res = await fetch(server.url + Feeds.dedicatedServerSavegame(server.code, DSSFile.CareerSavegame), init)
            .catch(err => log("Red", `${serverAcroUp} CSG ${err.message}`));

        if (!res || res.status === constants.HTTP_STATUS_NO_CONTENT) return null;

        return jsonFromXML<FSLoopCSG>(await res.text()).careerSavegame;
    })();

    // Request(s) failed
    if (!dss || !csg) {
        return await statsMsgEdit(
            new EmbedBuilder().setTitle("Host not responding").setColor(client.config.EMBED_COLOR_RED),
            false
        );
    }

    const newPlayerList = filterUnused(dss.slots.players);
    const oldPlayerList = structuredClone(fsCacheData.players);

    if (!dss.server.name) {
        if (fsCacheData.state === 1) {
            embedBuffer.push(serverStatusEmbed("offline"));

            justStopped = true;
        }

        client.fs25Cache[serverAcro].state = 0;
    } else {
        if (fsCacheData.state === 0) {
            embedBuffer.push(serverStatusEmbed("online"));

            justStarted = true;
        }

        client.fs25Cache[serverAcro].state = 1;
    }

    const toThrottle = (() => { // Throttle Discord message updating if no changes in API data
        if (!fsCacheData.completeRes) return false;

        if (justStarted || justStopped) return false;

        if (JSON.stringify(newPlayerList) !== JSON.stringify(oldPlayerList)) return false;

        if (!dss.server.name && fsCacheData.state === 0) return true;

        if (dss.server.name && fsCacheData.state === 1) return true;

        return false;
    })();

    // Update cache
    client.fs25Cache[serverAcro].throttled = toThrottle;

    if (fsCacheData.graphPoints.length >= 120) client.fs25Cache[serverAcro].graphPoints.shift();

    client.fs25Cache[serverAcro].graphPoints.push(dss.slots.used);

    if (newPlayerList.some(x => x.isAdmin)) client.fs25Cache[serverAcro].lastAdmin = now * 1_000;

    if (!justStarted) client.fs25Cache[serverAcro].players = newPlayerList;

    if (toThrottle) return;

    // Create list of players with time data
    const playerInfo = newPlayerList.map(player => `\`${player.name}\` ${getDecorators(player, true)} **|** ${formatUptime(player)}`);

    // Data crunching for stats embed
    const stats = {
        money: (() => {
            const num = parseInt(csg.statistics?.money?._text);

            return Number.isNaN(num) ? "`unavailable`" : num.toLocaleString("en-US");
        })(),
        ingameTime: dss.server.dayTime
            ? [
                Math.floor(dss.server.dayTime / 3_600 / 1_000).toString().padStart(2, "0"),
                ":",
                Math.floor((dss.server.dayTime / 60 / 1_000) % 60).toString().padStart(2, "0")
            ].join("")
            : "`unavailable`",
        timescale: csg.settings?.timeScale._text
            ? parseFloat(csg.settings.timeScale._text) + "x"
            : "`unavailable`",
        playTime: (() => {
            const serverPlayTime = parseInt(csg.statistics.playTime._text);

            return serverPlayTime
                ? [
                    (serverPlayTime / 60).toLocaleString("en-US"),
                    "hrs (",
                    formatTime(serverPlayTime * 60 * 1_000, 3, { commas: true }),
                    ")"
                ].join("")
                : "`unavailable`";
        })(),
        seasons: csg.settings?.growthMode._text
            ? {
                "1": server.isPrivate ? "Yes" : "Yes 🔴",
                "2": "No",
                "3": "Paused 🔴",
            }[csg.settings?.growthMode?._text]
            : "`unavailable`",
        autosaveInterval: csg.settings?.autoSaveInterval._text
            ? parseInt(csg.settings?.autoSaveInterval._text).toFixed(0) + " min"
            : "`unavailable`",
        slotUsage: (() => {
            const num = parseInt(csg.slotSystem?._attributes?.slotUsage);

            return Number.isNaN(num) ? "`unavailable`" : num.toLocaleString("en-US");
        })()
    } as const;

    await statsMsgEdit(new EmbedBuilder()
        .setAuthor({ name: `${dss.slots.used}/${dss.slots.capacity}` })
        .setTitle(dss.server.name ? server.fullName : "Server is offline")
        .setDescription(dss.slots.used ? playerInfo.join("\n") : dss.server.name ? "*No players online*" : null)
        .setFields({
            name: "**Server Statistics**",
            value: [
                `**Money:** $${stats.money}`,
                `**In-game time:** ${stats.ingameTime}`,
                `**Timescale:** ${stats.timescale}`,
                `**Playtime:** ${stats.playTime}`,
                `**Map name:** ${dss.server.mapName || "`unavailable`"}`,
                `**Seasonal growth:** ${stats.seasons}`,
                `**Autosave interval:** ${stats.autosaveInterval}`,
                `**Game version:** ${dss.server.version || "`unavailable`"}`,
                `**Slot usage:** ${stats.slotUsage}`
            ].join("\n")
        })
        .setColor(dss.slots.used === dss.slots.capacity
            ? client.config.EMBED_COLOR_RED
            : dss.slots.used > (dss.slots.capacity / 2)
                ? client.config.EMBED_COLOR_YELLOW
                : client.config.EMBED_COLOR_GREEN
        )
    );

    if (justStarted) return;

    const newAdmins = newPlayerList.filter(x => oldPlayerList.some(y => x.isAdmin && !y.isAdmin && y.name === x.name));
    const leftPlayers = oldPlayerList.filter(x => !newPlayerList.some(y => y.name === x.name));
    const joinedPlayers = oldPlayerList.length
        ? newPlayerList.filter(x => !oldPlayerList.some(y => y.name === x.name))
        : fsCacheData.state === null
            ? []
            : newPlayerList;

    for (const player of newAdmins) {
        const sendLoginAlert =
            !client.whitelist.cache.includes(player.name) &&
            !client.fmList.cache.includes(player.name) &&
            !server.isPrivate;

        if (sendLoginAlert) {
            await client.getChan("juniorAdminChat").send({ embeds: [new EmbedBuilder()
                .setTitle("UNKNOWN ADMIN LOGIN")
                .setDescription(`\`${player.name}\` on **${serverAcroUp}** at ${timestamp}`)
                .setColor("#ff4d00")
            ] });
        }

        embedBuffer.push(new EmbedBuilder()
            .setColor(client.config.EMBED_COLOR_YELLOW)
            .setDescription(`\`${player.name}\`${getDecorators(player)} logged in as admin on **${serverAcroUp}** at ${timestamp}`)
        );
    }

    for (const player of leftPlayers) {
        const watchListData = watchList.find(x => x._id === player.name);
        const embed = new EmbedBuilder()
            .setDescription(`\`${player.name}\`${getDecorators(player)} left **${serverAcroUp}** at ${timestamp}`)
            .setColor(client.config.EMBED_COLOR_RED)
            .setFooter(player.uptime ? { text: `Playtime: ${formatUptime(player)}` } : null);

        if (player.uptime) await client.playerTimes25.addPlayerTime(player.name, player.uptime, serverAcro);

        if (watchListData) {
            await wlChannel.send({ embeds: [new EmbedBuilder()
                .setTitle(`WatchList - ${watchListData.isSevere ? "ban" : "watch over"}`)
                .setDescription(`\`${watchListData._id}\` left **${serverAcroUp}** at ${timestamp}`)
                .setColor(client.config.EMBED_COLOR_RED)
            ] });
        }

        embedBuffer.push(embed);
    }

    for (const player of joinedPlayers) {
        const watchListData = watchList.find(y => y._id === player.name);
        const embed = new EmbedBuilder().setColor(client.config.EMBED_COLOR_GREEN);
        let description = `\`${player.name}\`${getDecorators(player)} joined **${serverAcroUp}** at ${timestamp}`;

        if (player.uptime) embed.setFooter({ text: `Playtime: ${formatUptime(player)}` });

        if (player.uptime > 1) {
            const comparableUptimes = [player.uptime, player.uptime - 1];
            const candidate = oldPlayerList
                .filter(x => !newPlayerList.some(y => y.name === x.name))
                .find(x => comparableUptimes.includes(x.uptime));

            if (candidate) description += `\nPossible name change from \`${candidate.name}\``;
        }

        embed.setDescription(description);

        if (watchListData) {
            const filterWLPings = client.watchListPings.cache.filter(x =>
                !client.mainGuild().members.cache.get(x)?.roles.cache.has(client.config.mainServer.roles.loa)
            );

            await wlChannel.send({
                content: watchListData.isSevere ? filterWLPings.map(userMention).join(" ") : undefined,
                embeds: [new EmbedBuilder()
                    .setTitle(`WatchList - ${watchListData.isSevere ? "ban" : "watch over"}`)
                    .setDescription(`\`${watchListData._id}\` joined **${serverAcroUp}** at ${timestamp}`)
                    .setColor(client.config.EMBED_COLOR_GREEN)
                    .setFooter({ text: `Reason: ${watchListData.reason}` })
                ]
            });
        }

        embedBuffer.push(embed);
    }
}