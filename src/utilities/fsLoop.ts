import { EmbedBuilder, TextChannel } from "discord.js";
import type TClient from "../client.js";
import { xml2js } from "xml-js";
import { formatRequestInit, formatTime, getFSURL, log } from '../utilities.js';
import { FSLoopCSG, FSLoopDSS, FSLoopDSSPlayer, FSServer, WatchListDocument } from "../typings.js";

export async function fsLoop(client: TClient, watchList: WatchListDocument[], server: FSServer, serverAcro: string) {
    function decorators(player: FSLoopDSSPlayer, publicLoc?: boolean) {
        let decorators = player.isAdmin ? ':detective:' : ''; // Tag for if player is admin
    
        decorators += client.fmList.data.includes(player.name) ? ':farmer:' : ''; // Tag for if player is FM
        decorators += client.tfList.data.includes(player.name) ? ':angel:' : ''; // Tag for if player is TF
        decorators += (client.whitelist.data.includes(player.name) && !publicLoc) ? ':white_circle:' : ''; // Tag for if player is on whitelist and location is not public
        decorators += watchList?.some(x => x._id === player.name) ? ':no_entry:' : ''; // Tag for if player is on watchList
    
        return decorators;
    }

    function wlEmbed(playerName: string, joinLog: boolean, wlReason?: string) {
        const embed = new EmbedBuilder()
            .setTitle('WatchList')
            .setDescription(`\`${playerName}\` ${joinLog ? 'joined' : 'left'} **${serverAcroUp}** at <t:${now}:t>`);

        if (joinLog) {
            return embed.setColor(client.config.EMBED_COLOR_GREEN).setFooter({ text: `Reason: ${wlReason}` });
        } else return embed.setColor(client.config.EMBED_COLOR_RED);
    }

    function logEmbed(player: FSLoopDSSPlayer, joinLog: boolean) {
        const playTimeHrs = Math.floor(player.uptime / 60);
        const playTimeMins = (player.uptime % 60).toString().padStart(2, '0');
        const embed = new EmbedBuilder()
            .setDescription(`\`${player.name}\`${decorators(player)} ${joinLog ? 'joined' : 'left'} **${serverAcroUp}** at <t:${now}:t>`)
            .setColor(joinLog ? client.config.EMBED_COLOR_GREEN : client.config.EMBED_COLOR_RED)
            .setFooter(player.uptime ? { text: `Playtime: ${playTimeHrs}:${playTimeMins}` } : null);

        return embed;
    }

    const serverAcroUp = serverAcro.toUpperCase();
    const statsEmbed = new EmbedBuilder();
    const statsMsgEdit = async () => {
        const channel = client.channels.cache.get(server.channelId) as TextChannel | undefined;
        
        await channel?.messages?.edit(server.messageId, { embeds: [statsEmbed] }).catch(() => log('Red', `FSLoop ${serverAcroUp} invalid msg`));
    };
    const init = formatRequestInit(7_000, "FSLoop");

    const dss = await fetch(getFSURL(server, "dss"), init) // Fetch dedicated-server-stats.json
        .then(res => res.json() as Promise<FSLoopDSS>)
        .catch(err => log('Red', `${serverAcroUp} DSS ${err.message}`));

    const csg = !dss ? null : await fetch(getFSURL(server, "csg"), init) // Fetch dedicated-server-savegame.html if DSS was successful
        .then(async res => {
            if (res.status !== 204) {
                const { careerSavegame } = xml2js(await res.text(), { compact: true }) as FSLoopCSG;

                return careerSavegame;
            } else statsEmbed.setImage('https://http.cat/204');
        })
        .catch(err => log('Red', `${serverAcroUp} CSG ${err.message}`));

    if (!dss || !dss.slots || !csg) {
        if (dss && !dss.slots) log('Red', `${serverAcroUp} DSS empty object`);

        statsEmbed.setTitle('Host not responding').setColor(client.config.EMBED_COLOR_RED);
        await statsMsgEdit();

        return;
    }

    const newPlayers = dss.slots.players.filter(x=>x.isUsed);
    const oldPlayers = client.fsCache[serverAcro].players;
    const serverStatusEmbed = (status: string) => new EmbedBuilder().setTitle(`${serverAcroUp} now ${status}`).setColor(client.config.EMBED_COLOR_YELLOW).setTimestamp();
    const wlChannel = client.getChan('watchList');
    const logChannel = client.getChan('fsLogs');
    const now = Math.round(Date.now() / 1000);
    const playerInfo: string[] = [];
    let justStarted = false;

    for (const player of newPlayers) {
        const playTimeHrs = Math.floor(player.uptime / 60);
        const playTimeMins = (player.uptime % 60).toString().padStart(2, '0');

        playerInfo.push(`\`${player.name}\` ${decorators(player, true)} **|** ${playTimeHrs}:${playTimeMins}`);
    };

    // Data crunching for stats embed
    const stats = {
        money: (() => {
            const num = parseInt(csg.statistics?.money?._text);

            return Number.isNaN(num) ? "`unavailable`" : num.toLocaleString('en-US');
        })(),
        ingameTime: dss.server.dayTime
            ? [
                Math.floor(dss.server?.dayTime / 3600 / 1000).toString().padStart(2, "0"),
                ":",
                Math.floor((dss.server?.dayTime / 60 / 1000) % 60).toString().padStart(2, '0')
            ].join('')
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
                    formatTime(time * 60 * 1000, 3, { commas: true, longNames: false }),
                    ")"
                ].join('')
                : "`unavailable`";
        })(),
        seasons: csg.settings?.growthMode._text
            ? {
                '1': client.config.fs[serverAcro].isPrivate ? 'Yes' : 'Yes 🔴',
                '2': 'No',
                '3': 'Paused 🔴',
            }[csg.settings?.growthMode?._text]
            : "`unavailable`",
        autosaveInterval: csg.settings?.autoSaveInterval._text
            ? parseInt(csg.settings?.autoSaveInterval._text).toFixed(0) + " min"
            : "`unavailable`",
        slotUsage: (() => {
            const num = parseInt(csg.slotSystem?._attributes?.slotUsage);

            return Number.isNaN(num) ? "`unavailable`" : num.toLocaleString('en-US');
        })()
    } as const;

    // Stats embed
    statsEmbed
        .setAuthor({ name: `${dss.slots.used}/${dss.slots.capacity}` })
        .setTitle(dss.server.name ? null : 'Server is offline')
        .setColor(client.config.EMBED_COLOR_GREEN)
        .setDescription(dss.slots.used ? playerInfo.join('\n') : dss.server.name ? '*No players online*' : null)
        .setFields({
            name: `**Server Statistics**`,
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
            ].join('\n')
        });

    if (dss.slots.used === dss.slots.capacity) {
        statsEmbed.setColor(client.config.EMBED_COLOR_RED);
    } else if (dss.slots.used > 9) statsEmbed.setColor(client.config.EMBED_COLOR_YELLOW);

    await statsMsgEdit();
    
    // Logs
    if (!dss.server.name) {
        if (client.fsCache[serverAcro].status === 'online') await logChannel.send({ embeds: [serverStatusEmbed('offline')] });

        client.fsCache[serverAcro].status = 'offline';
    } else {
        if (client.fsCache[serverAcro].status === 'offline') {
            await logChannel.send({ embeds: [serverStatusEmbed('online')] });
            justStarted = true;
        }

        client.fsCache[serverAcro].status = 'online';
    }

    if (justStarted) return;
    
    for (const player of newPlayers.filter(x => oldPlayers.some(y => x.isAdmin && !y.isAdmin && y.name === x.name))) {
        if (!client.whitelist.data.includes(player.name) && !client.fmList.data.includes(player.name) && !client.config.fs[serverAcro].isPrivate) {
            await client.getChan('juniorAdminChat').send({ embeds: [new EmbedBuilder()
                .setTitle('UNKNOWN ADMIN LOGIN')
                .setDescription(`\`${player.name}\` on **${serverAcroUp}** on <t:${now}>`)
                .setColor('#ff4d00')
            ] }); 
        } else await logChannel.send({ embeds: [new EmbedBuilder()
            .setColor(client.config.EMBED_COLOR_YELLOW)
            .setDescription(`\`${player.name}\`${decorators(player)} logged in as admin on **${serverAcroUp}** at <t:${now}:t>`)
        ] });
    }
    
    // Filter for players leaving
    for (const player of oldPlayers.filter(x => !newPlayers.some(y => y.name === x.name))) {
        const inWl = watchList.find(x => x._id === player.name);

        if (inWl) await wlChannel.send({ embeds: [wlEmbed(inWl._id, false)] });
        
        if (player.uptime) await client.playerTimes.addPlayerTime(player.name, player.uptime, serverAcro);
        
        await logChannel.send({ embeds: [logEmbed(player, false)] });
    };

    // Filter for players joining
    const playerObj = (() => {
        if (oldPlayers.length) {
            return newPlayers.filter(x => !oldPlayers.some(y => y.name === x.name));
        } else if (client.uptime > 50_000) {
            return newPlayers;
        }
    })();
    
    if (playerObj) for (const player of playerObj) {
        const inWl = watchList.find(y => y._id === player.name);

        if (inWl) {
            const filterWLPings = client.watchListPings.data.filter(x => !client.mainGuild().members.cache.get(x)?.roles.cache.has(client.config.mainServer.roles.loa));

            await wlChannel.send({ content: filterWLPings.map(x => `<@${x}>`).join(" "), embeds: [wlEmbed(inWl._id, true, inWl.reason)] });
        }

        await logChannel.send({ embeds: [logEmbed(player, true)] });
    };
    
    // Update cache
    if (client.fsCache[serverAcro].graphPoints.length >= 120) client.fsCache[serverAcro].graphPoints.shift();
    if (dss.slots.players.some(x => x.isAdmin)) client.fsCache[serverAcro].lastAdmin = now * 1000;

    client.fsCache[serverAcro].graphPoints.push(dss.slots.used);
    client.fsCache[serverAcro].players = newPlayers;
}

export async function fsLoopAll(client: TClient, watchList: WatchListDocument[]) {
    const embed = new EmbedBuilder().setColor(client.config.EMBED_COLOR);
    const totalCount: number[] = [];

    for (const [serverAcro, server] of Object.entries(client.fsCache)) {
        const playerInfo: string[] = [];
        const serverSlots = server.players.length;

        totalCount.push(serverSlots);

        for (const player of server.players) {
            const playTimeHrs = Math.floor(player.uptime / 60);
            const playTimeMins = (player.uptime % 60).toString().padStart(2, '0');
            let decorators = player.isAdmin ? ':detective:' : ''; // Tag for if player is admin
            
            decorators += client.fmList.data.includes(player.name) ? ':farmer:' : ''; // Tag for if player is FM
            decorators += client.tfList.data.includes(player.name) ? ':angel:' : ''; // Tag for if player is TF
            decorators += client.whitelist.data.includes(player.name) ? ':white_circle:' : ''; // Tag for if player is on whitelist
            decorators += watchList.some(x => x._id === player.name) ? ':no_entry:' : ''; // Tag for if player is on watchList

            playerInfo.push(`\`${player.name.slice(0, 46)}\` ${decorators} **|** ${playTimeHrs}:${playTimeMins}`);
        }
        
        if (playerInfo.length) embed.addFields({ name: `${serverAcro.toUpperCase()} - ${serverSlots}/16`, value: playerInfo.join('\n') });
    }

    await client.getChan('juniorAdminChat').messages.edit(client.config.mainServer.fsLoopMsgId, {
        content: `\`\`\`js\n['${client.whitelist.data.join("', '")}']\`\`\`Updates every 30 seconds`,
        embeds: [embed.setTitle(totalCount.reduce((a, b) => a + b, 0) + ' online')]
    }).catch(() => log('Red', 'FSLoopAll invalid msg'));
}
