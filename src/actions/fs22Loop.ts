import { ChannelType, EmbedBuilder, userMention } from "discord.js";
import type TClient from "../client.js";
import {
    DSSExtension,
    DSSFile,
    type DSSResponse,
    Feeds,
    filterUnused,
    type PlayerUsed
} from "farming-simulator-types/2022";
import { constants } from "http2";
import lodash from "lodash";
import {
    formatDecorators,
    formatRequestInit,
    formatTime,
    formatUptime,
    fs22Servers,
    jsonFromXML,
    log
} from "#util";
import type { FSLoopCSG } from "#typings";

export async function fs22Loop(client: TClient, watchList: TClient["watchList"]["doc"][], serverAcro: string, embedBuffer: EmbedBuilder[]) {
    if (client.config.toggles.debug) log("Yellow", "FS22Loop", serverAcro);

    const server = fs22Servers.getOne(serverAcro);

    function wlEmbed(document: TClient["watchList"]["doc"], joinLog: boolean) {
        const watchListReference = document.reference ? `\nReference: ${document.reference}` : "";
        const embed = new EmbedBuilder()
            .setTitle(`WatchList - ${document.isSevere ? "ban" : "watch over"}`)
            .setDescription(`\`${document._id}\` ${joinLog ? "joined" : "left"} **${serverAcroUp}** at <t:${now}:t>` + watchListReference);

        if (joinLog) {
            embed.setColor(client.config.EMBED_COLOR_GREEN).setFooter({ text: `Reason: ${document.reason}` });
        } else {
            embed.setColor(client.config.EMBED_COLOR_RED);
        }

        return embed;
    }

    function logEmbed(player: PlayerUsed, joinLog: boolean) {
        const playerTimesData = client.playerTimes22.cache.find(x => x._id === player.name);
        const playerDiscordMention = playerTimesData?.discordid ? userMention(playerTimesData.discordid) : "";
        const decorators = formatDecorators(client, player, watchList);
        let description = `\`${player.name}\`${decorators}${playerDiscordMention} ${joinLog ? "joined" : "left"} **${serverAcroUp}** at <t:${now}:t>`;
        const playTimeHrs = Math.floor(player.uptime / 60);
        const playTimeMins = (player.uptime % 60).toString().padStart(2, "0");
        const embed = new EmbedBuilder()
            .setColor(joinLog ? client.config.EMBED_COLOR_GREEN : client.config.EMBED_COLOR_RED)
            .setFooter(player.uptime ? { text: `Playtime: ${playTimeHrs}:${playTimeMins}` } : null);

        if (joinLog && player.uptime > 1) {
            const comparableUptimes = [player.uptime, player.uptime - 1];
            const candidate = oldPlayerList
                .filter(x => !newPlayerList.some(y => y.name === x.name))
                .find(x => comparableUptimes.includes(x.uptime));

            if (candidate) description += `\nPossible name change from \`${candidate.name}\``;
        }

        embed.setDescription(description);

        return embed;
    }

    let justStarted = false;
    let justStopped = false;
    const serverAcroUp = serverAcro.toUpperCase();
    const now = Math.round(Date.now() / 1_000);
    const fsCacheServer = client.fs22Cache[serverAcro];
    const justInstantiated = fsCacheServer.state === null;
    const failedEmbed = new EmbedBuilder().setTitle("Host not responding").setColor(client.config.EMBED_COLOR_RED);
    const init = formatRequestInit(7_000, "FSLoop");
    const wlChannel = client.getChan("watchList");
    const serverStatusEmbed = (status: string) => new EmbedBuilder()
        .setTitle(`${serverAcroUp} now ${status}`)
        .setColor(client.config.EMBED_COLOR_YELLOW)
        .setTimestamp();
    const statsMsgEdit = async (embed: EmbedBuilder, completeRes = true) => {
        const channel = client.channels.cache.get(server.channelId);

        fsCacheServer.completeRes = completeRes;

        if (channel?.type !== ChannelType.GuildText) return log("Red", `FSLoop ${serverAcroUp} invalid channel`);

        await channel.messages.edit(
            server.messageId,
            { embeds: [embed] }
        ).catch(() => log("Red", `FSLoop ${serverAcroUp} invalid msg`));
    };

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

    if (!dss || !csg) return await statsMsgEdit(failedEmbed, false); // Request(s) failed

    const newPlayerList = filterUnused(dss.slots.players);
    const oldPlayerList = structuredClone(fsCacheServer.players);

    if (!dss.server.name) {
        if (fsCacheServer.state === 1) {
            embedBuffer.push(serverStatusEmbed("offline"));

            justStopped = true;
        }

        fsCacheServer.state = 0;
    } else {
        if (fsCacheServer.state === 0) {
            embedBuffer.push(serverStatusEmbed("online"));

            justStarted = true;
        }

        fsCacheServer.state = 1;
    }

    const toThrottle = (() => { // Throttle Discord message updating if no changes in API data
        if (!fsCacheServer.completeRes) return false;

        if (justStarted || justStopped) return false;

        if (!lodash.isEqual(newPlayerList, oldPlayerList)) return false;

        if (!dss.server.name && fsCacheServer.state === 0) return true;

        if (dss.server.name && fsCacheServer.state === 1) return true;

        return false;
    })();

    // Update cache
    fsCacheServer.throttled = toThrottle;

    if (fsCacheServer.graphPoints.length >= 120) fsCacheServer.graphPoints.shift();

    fsCacheServer.graphPoints.push(dss.slots.used);

    if (newPlayerList.some(x => x.isAdmin)) fsCacheServer.lastAdmin = now * 1_000;

    if (!justStarted) fsCacheServer.players = newPlayerList;

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
            const time = parseInt(csg.statistics.playTime._text);

            return time
                ? [
                    (time / 60).toLocaleString("en-US"),
                    "hrs (",
                    formatTime(time * 60 * 1_000, 3, { commas: true }),
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

    for (const player of newPlayerList.filter(x =>
        oldPlayerList.some(y => x.isAdmin && !y.isAdmin && y.name === x.name)
    )) {
        if (
            !client.whitelist.cache.includes(player.name)
            && !client.fmList.cache.includes(player.name)
            && !server.isPrivate
        ) {
            await client.getChan("juniorAdminChat").send({ embeds: [new EmbedBuilder()
                .setTitle("UNKNOWN ADMIN LOGIN")
                .setDescription(`\`${player.name}\` on **${serverAcroUp}** on <t:${now}>`)
                .setColor("#ff4d00")
            ] });
        } else embedBuffer.push(new EmbedBuilder()
            .setColor(client.config.EMBED_COLOR_YELLOW)
            .setDescription(`\`${player.name}\`${formatDecorators(client, player, watchList)} logged in as admin on **${serverAcroUp}** at <t:${now}:t>`)
        );
    }

    // Filter for players leaving
    for (const player of oldPlayerList.filter(x => !newPlayerList.some(y => y.name === x.name))) {
        const inWl = watchList.find(x => x._id === player.name);

        if (inWl) await wlChannel.send({ embeds: [wlEmbed(inWl, false)] });

        await client.playerTimes22.addPlayerTime(player.name, player.uptime, serverAcro);

        embedBuffer.push(logEmbed(player, false));
    }

    // Filter for players joining
    const joinedPlayers = oldPlayerList.length
        ? newPlayerList.filter(x => !oldPlayerList.some(y => y.name === x.name))
        : justInstantiated
            ? []
            : newPlayerList;

    for (const player of joinedPlayers) {
        const inWl = watchList.find(y => y._id === player.name);

        if (inWl) {
            const filterWLPings = client.watchListPings.cache.filter(x =>
                !client.mainGuild().members.cache.get(x)?.roles.cache.has(client.config.mainServer.roles.loa)
            );

            await wlChannel.send({
                content: inWl.isSevere ? filterWLPings.map(x => `<@${x}>`).join(" ") : undefined,
                embeds: [wlEmbed(inWl, true)]
            });
        }

        embedBuffer.push(logEmbed(player, true));
    }
}