import { ChannelType, EmbedBuilder, time, userMention } from "discord.js";
import type TClient from "../client.js";
import { DSSExtension, DSSFile, type DSSResponse, Feeds, filterUnused } from "farming-simulator-types/2025";
import { constants } from "http2";
import lodash from "lodash";
import {
    formatDecorators,
    formatRequestInit,
    formatTime,
    formatUptime,
    fs25Servers,
    jsonFromXML,
    log
} from "#util";
import type { FSLoopCSG, FS25Cache } from "#typings";

enum ServerState {
    Offline,
    Online,
}

export async function fs25Loop(client: TClient, watchList: TClient["watchList"]["doc"][], serverAcro: string, embedBuffer: EmbedBuilder[]) {
    if (client.config.toggles.debug) log("Yellow", "FS25Loop", serverAcro);

    const serverAcroUp = serverAcro.toUpperCase();
    const now = Date.now();
    const timestamp = time(new Date(), "t");

    function serverStatusEmbed(status: string) {
        return new EmbedBuilder()
            .setTitle(`${serverAcroUp} now ${status}`)
            .setColor(client.config.EMBED_COLOR_YELLOW)
            .setTimestamp();
    }

    function setCacheValue<Key extends keyof FS25Cache[string]>(key: Key, value: FS25Cache[string][Key]) {
        client.fs25Cache[serverAcro][key] = value;
    }

    async function statsMsgEdit(embed: EmbedBuilder, completeRes = true) {
        const channel = client.channels.cache.get(server.channelId);

        setCacheValue("completeRes", completeRes);

        if (channel?.type !== ChannelType.GuildText) return log("Red", `FSLoop ${serverAcroUp} invalid channel`);

        await channel.messages.edit(server.messageId, { embeds: [embed] }).catch(() => log("Red", `FSLoop ${serverAcroUp} invalid msg`));
    }

    const oldCacheData = structuredClone(client.fs25Cache[serverAcro]);
    const server = fs25Servers.getOne(serverAcro);
    const init = formatRequestInit(7_000, "FSLoop");
    const wlChannel = client.getChan("watchList");
    let isFaultyStart = Boolean(oldCacheData.faultyStartData.length);
    let justStopped = false;
    let justStarted = false;

    // Fetch dedicated-server-stats.json and parse
    const dss = await (async () => {
        const res = await fetch(server.url + Feeds.dedicatedServerStats(server.code, DSSExtension.JSON), init)
            .catch(err => log("Red", serverAcroUp, "DSS Fetch:", err.message));

        if (!res || res.status !== constants.HTTP_STATUS_OK) return null;

        const data: DSSResponse | void = await res.json().catch(err => log("Red", serverAcroUp, "DSS Parse:", err.message));

        if (!data?.slots) return null;

        return data;
    })();

    // Fetch dedicated-server-savegame.html and parse if DSS was successful
    const csg = await (async () => {
        if (!dss) return null;

        const res = await fetch(server.url + Feeds.dedicatedServerSavegame(server.code, DSSFile.CareerSavegame), init)
            .catch(err => log("Red", serverAcroUp, "CSG Fetch:", err.message));

        if (!res || res.status !== constants.HTTP_STATUS_OK) return null;

        const body = await res.text().catch(err => log("Red", serverAcroUp, "CSG Parse:", err.message));

        if (!body) return null;

        return jsonFromXML<FSLoopCSG>(body).careerSavegame;
    })();

    // Request(s) failed
    if (!dss || !csg) {
        return await statsMsgEdit(
            new EmbedBuilder().setTitle("Host not responding").setColor(client.config.EMBED_COLOR_RED),
            false
        );
    }

    if (dss.slots.capacity === 1) return;

    const newPlayerList = filterUnused(dss.slots.players);
    const oldPlayerList = structuredClone(oldCacheData.players);

    if (dss.slots.capacity === 0) {
        if (oldCacheData.state === ServerState.Online) {
            embedBuffer.push(serverStatusEmbed("offline"));

            justStopped = true;
        }

        setCacheValue("state", ServerState.Offline);
    } else {
        if (oldCacheData.state === ServerState.Offline) {
            embedBuffer.push(serverStatusEmbed("online"));

            justStarted = true;

            if (newPlayerList.length) {
                setCacheValue("faultyStartData", newPlayerList);

                isFaultyStart = true;
            }
        }

        setCacheValue("state", ServerState.Online);
    }

    const toThrottle = (() => { // Throttle Discord message updating if no changes in API data
        if (!oldCacheData.completeRes) return false;

        if (justStarted || justStopped || isFaultyStart) return false;

        if (!lodash.isEqual(newPlayerList, oldPlayerList)) return false;

        if (dss.slots.capacity === 0 && oldCacheData.state === ServerState.Offline) return true;

        if (dss.slots.capacity !== 0 && oldCacheData.state === ServerState.Online) return true;

        return false;
    })();

    // Update cache
    setCacheValue("throttled", toThrottle);

    if (oldCacheData.graphPoints.length >= 120) client.fs25Cache[serverAcro].graphPoints.shift();

    client.fs25Cache[serverAcro].graphPoints.push(dss.slots.used);

    if (newPlayerList.some(x => x.isAdmin)) setCacheValue("lastAdmin", now);

    if (!justStarted && isFaultyStart && !lodash.isEqual(oldCacheData.faultyStartData, newPlayerList)) {
        setCacheValue("faultyStartData", []);

        isFaultyStart = false;
    }

    if (!isFaultyStart) setCacheValue("players", newPlayerList);

    if (toThrottle) return;

    // Create list of players with time data
    const playerInfo = newPlayerList.map(player => `\`${player.name}\` ${formatDecorators(client, player)} **|** ${formatUptime(player)}`);

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

    if (justStarted || isFaultyStart) return;

    const newAdmins = newPlayerList.filter(x => oldPlayerList.some(y => x.isAdmin && !y.isAdmin && y.name === x.name));
    const leftPlayers = oldPlayerList.filter(x => !newPlayerList.some(y => y.name === x.name));
    const joinedPlayers = oldPlayerList.length
        ? newPlayerList.filter(x => !oldPlayerList.some(y => y.name === x.name))
        : oldCacheData.state === null
            ? []
            : newPlayerList;

    for (const player of newAdmins) {
        const sendLoginAlert =
            !client.whitelist.cache.includes(player.name) &&
            !client.fmList.cache.includes(player.name) &&
            !server.isPrivate;
        const decorators = formatDecorators(client, player, watchList);

        if (sendLoginAlert) {
            await client.getChan("juniorAdminChat").send({ embeds: [new EmbedBuilder()
                .setTitle("UNKNOWN ADMIN LOGIN")
                .setDescription(`\`${player.name}\` on **${serverAcroUp}** at ${timestamp}`)
                .setColor("#ff4d00")
            ] });
        }

        embedBuffer.push(new EmbedBuilder()
            .setColor(client.config.EMBED_COLOR_YELLOW)
            .setDescription(`\`${player.name}\`${decorators} logged in as admin on **${serverAcroUp}** at ${timestamp}`)
        );
    }

    for (const player of leftPlayers) {
        const watchListData = watchList.find(x => x._id === player.name);
        const playerTimesData = client.playerTimes25.cache.find(x => x._id === player.name);
        const playerDiscordMention = playerTimesData?.discordid ? userMention(playerTimesData.discordid) : "";
        const decorators = formatDecorators(client, player, watchList);
        const embed = new EmbedBuilder()
            .setDescription(`\`${player.name}\`${decorators}${playerDiscordMention} left **${serverAcroUp}** at ${timestamp}`)
            .setColor(client.config.EMBED_COLOR_RED)
            .setFooter(player.uptime ? { text: `Playtime: ${formatUptime(player)}` } : null);

        await client.playerTimes25.addPlayerTime(player.name, player.uptime, serverAcro);

        if (watchListData) {
            await wlChannel.send({ embeds: [new EmbedBuilder()
                .setTitle(`WatchList - ${watchListData.isSevere ? "ban" : "watch over"}`)
                .setDescription(`\`${watchListData._id}\` left **${serverAcroUp}** at ${timestamp}`)
                .setFooter(player.uptime ? { text: `Playtime: ${formatUptime(player)}` } : null)
                .setColor(client.config.EMBED_COLOR_RED)
            ] });
        }

        embedBuffer.push(embed);
    }

    for (const player of joinedPlayers) {
        const watchListData = watchList.find(y => y._id === player.name)?.toObject();
        const embed = new EmbedBuilder().setColor(client.config.EMBED_COLOR_GREEN);
        const playerTimesData = client.playerTimes25.cache.find(x => x._id === player.name);
        const playerDiscordMention = playerTimesData?.discordid ? " " + userMention(playerTimesData.discordid) : "";
        const decorators = formatDecorators(client, player, watchList);
        let description = `\`${player.name}\`${decorators}${playerDiscordMention} joined **${serverAcroUp}** at ${timestamp}`;

        if (player.uptime) embed.setFooter({ text: "Playtime: " + formatUptime(player) });

        if (player.uptime > 1) {
            const comparableUptimes = [player.uptime, player.uptime - 1];
            const candidate = oldPlayerList
                .filter(x => !newPlayerList.some(y => y.name === x.name))
                .find(x => comparableUptimes.includes(x.uptime));

            if (candidate) description += `\nPossible name change from \`${candidate.name}\``;
        }

        embed.setDescription(description);

        if (watchListData) {
            const watchListReference = watchListData.reference ? "\nReference: " + watchListData.reference : "";
            const filterWLPings = client.watchListPings.cache.filter(x =>
                !client.mainGuild().members.cache.get(x)?.roles.cache.has(client.config.mainServer.roles.loa)
            );

            await wlChannel.send({
                content: watchListData.isSevere ? filterWLPings.map(userMention).join(" ") : undefined,
                embeds: [new EmbedBuilder()
                    .setTitle(`WatchList - ${watchListData.isSevere ? "ban" : "watch over"}`)
                    .setDescription(`\`${watchListData._id}\` joined **${serverAcroUp}** at ` + timestamp + watchListReference)
                    .setColor(client.config.EMBED_COLOR_GREEN)
                    .setFooter({ text: "Reason: " + watchListData.reason })
                ]
            });
        }

        embedBuffer.push(embed);
    }
}