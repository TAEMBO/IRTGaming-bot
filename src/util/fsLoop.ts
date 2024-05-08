import { EmbedBuilder, TextChannel } from "discord.js";
import type TClient from "../client.js";
import {
    DSSExtension,
    DSSFile,
    type DSSResponse,
    Feeds,
    filterUnused,
    type PlayerUsed
} from "farming-simulator-types/2022";
import { formatRequestInit, formatTime, jsonFromXML, log } from "./index.js";
import type { FSLoopCSG, FSServer, WatchListDocument } from "../typings.js";

export async function fsLoop(client: TClient, watchList: WatchListDocument[], server: FSServer, serverAcro: string) {
    if (client.config.toggles.debug) log("Yellow", "FSLoop", serverAcro);

    function decorators(player: PlayerUsed, publicLoc?: boolean) {
        let decorators = player.isAdmin ? ":detective:" : ""; // Tag for if player is admin
    
        decorators += client.fmList.cache.includes(player.name) ? ":farmer:" : ""; // Tag for if player is FM
        decorators += client.tfList.cache.includes(player.name) ? ":angel:" : ""; // Tag for if player is TF
        decorators += (client.whitelist.cache.includes(player.name) && !publicLoc) ? ":white_circle:" : ""; // Tag for if player is on whitelist and location is not public
        decorators += watchList?.some(x => x._id === player.name) ? ":no_entry:" : ""; // Tag for if player is on watchList
    
        return decorators;
    }

    function wlEmbed(document: WatchListDocument, joinLog: boolean) {
        const embed = new EmbedBuilder()
            .setTitle(`WatchList - ${document.isSevere ? "ban" : "watch over"}`)
            .setDescription(`\`${document._id}\` ${joinLog ? "joined" : "left"} **${serverAcroUp}** at <t:${now}:t>`);

        if (joinLog) {
            return embed.setColor(client.config.EMBED_COLOR_GREEN).setFooter({ text: `Reason: ${document.reason}` });
        } else return embed.setColor(client.config.EMBED_COLOR_RED);
    }

    function logEmbed(player: PlayerUsed, joinLog: boolean) {
        let description = `\`${player.name}\`${decorators(player)} ${joinLog ? "joined" : "left"} **${serverAcroUp}** at <t:${now}:t>`;
        const playTimeHrs = Math.floor(player.uptime / 60);
        const playTimeMins = (player.uptime % 60).toString().padStart(2, "0");
        const embed = new EmbedBuilder()
            .setColor(joinLog ? client.config.EMBED_COLOR_GREEN : client.config.EMBED_COLOR_RED)
            .setFooter(player.uptime ? { text: `Playtime: ${playTimeHrs}:${playTimeMins}` } : null);

        if (joinLog && player.uptime > 1) {
            const comparableUptimes = [player.uptime, player.uptime - 1];
            const candidate = oldPlayers
                .filter(x => !newPlayers.some(y => y.name === x.name))
                .find(x => comparableUptimes.includes(x.uptime));

            if (candidate) description += `\nPossible name change from \`${candidate.name}\``;
        }

        embed.setDescription(description);

        return embed;
    }

    const serverAcroUp = serverAcro.toUpperCase();
    const fsCacheServer = client.fsCache[serverAcro];
    const statsEmbed = new EmbedBuilder();
    const statsMsgEdit = async () => {
        const channel = client.channels.cache.get(server.channelId);

        if (!(channel instanceof TextChannel)) return log("Red", `FSLoop ${serverAcroUp} invalid channel`);
        
        await channel.messages.edit(server.messageId, { embeds: [statsEmbed] }).catch(() => log("Red", `FSLoop ${serverAcroUp} invalid msg`));
    };
    const init = formatRequestInit(7_000, "FSLoop");

    const dss = await fetch(server.url + Feeds.dedicatedServerStats(server.code, DSSExtension.JSON), init) // Fetch dedicated-server-stats.json
        .then(res => res.json() as Promise<DSSResponse>)
        .catch(err => log("Red", `${serverAcroUp} DSS ${err.message}`));

    const csg = !dss ? null : await fetch(server.url + Feeds.dedicatedServerSavegame(server.code, DSSFile.CareerSavegame), init) // Fetch dedicated-server-savegame.html if DSS was successful
        .then(async res => {
            if (res.status !== 204) {
                const { careerSavegame } = jsonFromXML<FSLoopCSG>(await res.text());

                return careerSavegame;
            } else statsEmbed.setImage("https://http.cat/204");
        })
        .catch(err => log("Red", `${serverAcroUp} CSG ${err.message}`));

    if (!dss || !dss.slots || !csg) {
        if (dss && !dss.slots) log("Red", `${serverAcroUp} DSS empty object`);

        statsEmbed.setTitle("Host not responding").setColor(client.config.EMBED_COLOR_RED);
        await statsMsgEdit();

        return;
    }

    const newPlayers = filterUnused(dss.slots.players);
    const oldPlayers = fsCacheServer.players;
    
    // Throttle message updating if no changes in API data
    if (JSON.stringify(newPlayers) === JSON.stringify(oldPlayers)) {
        if (!dss.server.name && fsCacheServer.status === 0) {
            fsCacheServer.isThrottled = true;
            
            return;
        } else if (dss.server.name && fsCacheServer.status === 1) {
            fsCacheServer.isThrottled = true;
            
            return;
        }
    }
    
    const serverStatusEmbed = (status: string) => new EmbedBuilder().setTitle(`${serverAcroUp} now ${status}`).setColor(client.config.EMBED_COLOR_YELLOW).setTimestamp();
    const wlChannel = client.getChan("watchList");
    const logChannel = client.getChan("fsLogs");
    const now = Math.round(Date.now() / 1_000);
    const playerInfo = newPlayers.map(player => {
        const playTimeHrs = Math.floor(player.uptime / 60);
        const playTimeMins = (player.uptime % 60).toString().padStart(2, "0");

        return `\`${player.name}\` ${decorators(player, true)} **|** ${playTimeHrs}:${playTimeMins}`;
    });
    let justStarted = false;

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
                "1": client.config.fs[serverAcro].isPrivate ? "Yes" : "Yes 🔴",
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

    // Stats embed
    statsEmbed
        .setAuthor({ name: `${dss.slots.used}/${dss.slots.capacity}` })
        .setTitle(dss.server.name ? null : "Server is offline")
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
        });

    dss.slots.used === dss.slots.capacity
        ? statsEmbed.setColor(client.config.EMBED_COLOR_RED)
        : dss.slots.used > (dss.slots.capacity / 2)
            ? statsEmbed.setColor(client.config.EMBED_COLOR_YELLOW)
            : statsEmbed.setColor(client.config.EMBED_COLOR_GREEN);

    await statsMsgEdit();
    
    // Logs
    if (!dss.server.name) {
        if (fsCacheServer.status === 1) await logChannel.send({ embeds: [serverStatusEmbed("offline")] });

        fsCacheServer.status = 0;
    } else {
        if (fsCacheServer.status === 0) {
            await logChannel.send({ embeds: [serverStatusEmbed("online")] });
            justStarted = true;
        }

        fsCacheServer.status = 1;
    }

    if (justStarted) return;
    
    for await (const player of newPlayers.filter(x => oldPlayers.some(y => x.isAdmin && !y.isAdmin && y.name === x.name))) {
        if (!client.whitelist.cache.includes(player.name) && !client.fmList.cache.includes(player.name) && !client.config.fs[serverAcro].isPrivate) {
            await client.getChan("juniorAdminChat").send({ embeds: [new EmbedBuilder()
                .setTitle("UNKNOWN ADMIN LOGIN")
                .setDescription(`\`${player.name}\` on **${serverAcroUp}** on <t:${now}>`)
                .setColor("#ff4d00")
            ] }); 
        } else await logChannel.send({ embeds: [new EmbedBuilder()
            .setColor(client.config.EMBED_COLOR_YELLOW)
            .setDescription(`\`${player.name}\`${decorators(player)} logged in as admin on **${serverAcroUp}** at <t:${now}:t>`)
        ] });
    }
    
    // Filter for players leaving
    for await (const player of oldPlayers.filter(x => !newPlayers.some(y => y.name === x.name))) {
        const inWl = watchList.find(x => x._id === player.name);

        if (inWl) await wlChannel.send({ embeds: [wlEmbed(inWl, false)] });
        
        if (player.uptime) await client.playerTimes.addPlayerTime(player.name, player.uptime, serverAcro);
        
        await logChannel.send({ embeds: [logEmbed(player, false)] });
    }

    // Filter for players joining
    const playerObj = (() => {
        if (oldPlayers.length) {
            return newPlayers.filter(x => !oldPlayers.some(y => y.name === x.name));
        } else if (client.uptime > 50_000) {
            return newPlayers;
        }
    })();
    
    if (playerObj) for await (const player of playerObj) {
        const inWl = watchList.find(y => y._id === player.name);

        if (inWl) {
            const filterWLPings = client.watchListPings.cache.filter(x => !client.mainGuild().members.cache.get(x)?.roles.cache.has(client.config.mainServer.roles.loa));

            await wlChannel.send({ content: inWl.isSevere ? filterWLPings.map(x => `<@${x}>`).join(" ") : undefined, embeds: [wlEmbed(inWl, true)] });
        }

        await logChannel.send({ embeds: [logEmbed(player, true)] });
    }
    
    // Update cache
    if (fsCacheServer.graphPoints.length >= 120) fsCacheServer.graphPoints.shift();
    if (newPlayers.some(x => x.isAdmin)) fsCacheServer.lastAdmin = now * 1_000;

    fsCacheServer.graphPoints.push(dss.slots.used);
    fsCacheServer.players = newPlayers;
    fsCacheServer.isThrottled = false;
}