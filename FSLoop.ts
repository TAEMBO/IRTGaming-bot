import Discord from "discord.js";
import YClient from "./client.js";
import { xml2js } from "xml-js";
import fs from "node:fs";
import type { FSLoopCSG, FSLoopDSS, FSLoopDSSPlayer } from "./typings.js";

function decorators(client: YClient, player: FSLoopDSSPlayer, watchList?: { _id: string, reason: string }[], publicLoc?: boolean) {
    const inWl = watchList?.some(x => x._id === player.name);
    let decorators = player.isAdmin ? ':detective:' : ''; // Tag for if player is admin
    decorators += client.FMlist._content.includes(player.name) ? ':farmer:' : ''; // Tag for if player is FM
    decorators += client.TFlist._content.includes(player.name) ? ':angel:' : ''; // Tag for if player is TF
    decorators += (client.whitelist._content.includes(player.name) && !publicLoc) ? ':white_circle:' : ''; // Tag for if player is on whitelist and location is not public
    decorators += inWl ? ':no_entry:' : ''; // Tag for if player is on watchList
    return decorators;
}

export default async (client: YClient, ChannelID: string, MessageID: string, serverAcro: string) => {
    function wlEmbed(playerName: string, joinLog: boolean, wlReason?: string) {
        const embed = new client.embed()
            .setTitle('WatchList')
            .setDescription(`\`${playerName}\` ${joinLog ? 'joined' : 'left'} **${serverAcro}** at <t:${now}:t>`);

        if (joinLog) {
            return embed.setColor(client.config.embedColorGreen).setFooter({ text: `Reason: ${wlReason}` });
        } else return embed.setColor(client.config.embedColorRed);
    }
    function logEmbed(player: FSLoopDSSPlayer, joinLog: boolean) {
        const playTimeHrs = Math.floor(player.uptime / 60);
        const playTimeMins = (player.uptime % 60).toString().padStart(2, '0');
        const embed = new client.embed().setDescription(`\`${player.name}\`${decorators(client, player, watchList)} ${joinLog ? 'joined': 'left'} **${serverAcro}** at <t:${now}:t>`);
    
        if (joinLog) {
            return embed.setColor(client.config.embedColorGreen);
        } else return embed.setColor(client.config.embedColorRed).setFooter({ text: `Playtime: ${playTimeHrs}:${playTimeMins}` });
    }
    function adminCheck() {
        for (const player of newPlayers.filter(x => oldPlayers.some(y => x.isAdmin && !y.isAdmin && y.name === x.name))) {
            if (!client.whitelist._content.includes(player.name) && !client.FMlist._content.includes(player.name)) {
                client.getChan('juniorAdminChat').send({ embeds: [new client.embed()
                    .setTitle('UNKNOWN ADMIN LOGIN')
                    .setDescription(`\`${player.name}\` on **${serverAcro}** on <t:${now}>`)
                    .setColor('#ff4d00')
                ] }); 
            } else logChannel.send({ embeds: [new client.embed()
                .setColor(client.config.embedColorYellow)
                .setDescription(`\`${player.name}\`${decorators(client, player, watchList)} logged into admin on **${serverAcro}** at <t:${now}:t>`)
            ] });
        }
    }
    function log() {
        // Filter for players leaving
        for (const player of oldPlayers.filter(x => !newPlayers.some(y => y.name === x.name))) {
            const inWl = watchList.find(x => x._id === player.name);
            if (inWl) wlChannel.send({ embeds: [wlEmbed(inWl._id, false)] });
            
            if (player.uptime > 0) client.playerTimes.addPlayerTime(player.name, player.uptime, serverAcro.toLowerCase() as 'ps' | 'pg' | 'mf'); // Add playerTimes data
            logChannel.send({ embeds: [logEmbed(player, false)] });
        };

        // Filter for players joining
        let playerObj;
        if (oldPlayers.length < 1 && (client.uptime as number) > 33000) {
            playerObj = newPlayers;
        } else if (oldPlayers.length > 0) playerObj = newPlayers.filter(y => !oldPlayers.some(z => z.name === y.name));
     
        if (playerObj) for (const x of playerObj) {
            const inWl = watchList.find(y => y._id === x.name);
            if (client.config.mainServer.id === '552565546089054218' && inWl) {
                const filterWLPings = client.watchListPings._content.filter(x => !client.mainGuild().members.cache.get(x)?.roles.cache.has(client.config.mainServer.roles.loa)).map(x=>`<@${x}>`).join(" ");
                wlChannel.send({ content: filterWLPings, embeds: [wlEmbed(inWl._id, true, inWl.reason)] });
            }
            logChannel.send({ embeds: [logEmbed(x, true)] });
        };
    }

    const statsEmbed = new client.embed();
    const statsMsgEdit = () => (client.channels.resolve(ChannelID) as Discord.TextChannel).messages.edit(MessageID, { embeds: [statsEmbed] }); 
    const init = { signal: AbortSignal.timeout(7000), headers: { 'User-Agent': 'IRTBot/FSLoop' } };

    const DSS = await fetch(client.config.fs[serverAcro.toLowerCase()].dss, init) // Fetch dedicated-server-stats.json
        .then(res => res.json() as Promise<FSLoopDSS>)
        .catch(err => client.log('\x1b[31m', `${serverAcro} dss ${err.message}`));

    const CSG = (!DSS ? null : await fetch(client.config.fs[serverAcro.toLowerCase()].csg, init).then(async res => { // Fetch dedicated-server-savegame.html
        if (res.status === 204) {
            statsEmbed.setImage('https://http.cat/204');
            client.log('\x1b[31m', `${serverAcro} csg empty content`);
        } else return (xml2js(await res.text(), { compact: true }) as any).careerSavegame as FSLoopCSG;
    }).catch(err => client.log('\x1b[31m', `${serverAcro} csg ${err.message}`)));

    if (!DSS || !DSS.slots || !CSG) { // Blame Red
        if (DSS && !DSS.slots) client.log('\x1b[31m', `${serverAcro} undefined slots`);
        statsEmbed.setTitle('Host not responding').setColor(client.config.embedColorRed);
        statsMsgEdit();
        return;
    }

    const newPlayers = DSS.slots.players.filter(x=>x.isUsed);
    const oldPlayers = client.FSCache[serverAcro].players;
    const watchList = await client.watchList._content.find();
    const serverStatusEmbed = (status: string) => new client.embed().setTitle(`${serverAcro} now ${status}`).setColor(client.config.embedColorYellow).setTimestamp();
    const wlChannel = client.getChan('watchList');
    const logChannel = client.getChan('fsLogs');
    const now = Math.round(Date.now() / 1000);
    const playerInfo: Array<string> = [];
    let justStarted = false;

    for (const player of newPlayers) {
        const playTimeHrs = Math.floor(player.uptime / 60);
        const playTimeMins = (player.uptime % 60).toString().padStart(2, '0');

        playerInfo.push(`\`${player.name}\` ${decorators(client, player, watchList, true)} **|** ${playTimeHrs}:${playTimeMins}`);
    };

    // Data crunching for stats embed
    const Money = parseInt(CSG.statistics?.money?._text).toLocaleString('en-US') ?? null;
    const IngameTimeHrs = Math.floor(DSS.server?.dayTime / 3600 / 1000).toString().padStart(2, '0') ?? null;
    const IngameTimeMins = Math.floor((DSS.server?.dayTime / 60 / 1000) % 60).toString().padStart(2, '0') ?? null;
    const Timescale = CSG.settings?.timeScale?._text?.slice(0, -5) ?? null;
    const playTimeHrs = (parseInt(CSG.statistics?.playTime?._text) / 60).toFixed(2) ?? null;
    const PlaytimeFormatted = client.formatTime((parseInt(CSG.statistics?.playTime?._text) * 60 * 1000), 3, { commas: true, longNames: false }) ?? null;
    const Seasons = { '1': serverAcro === 'MF' ? 'Yes' : 'Yes 🔴', '2': 'No', '3':'Paused 🔴' }[CSG.settings?.growthMode?._text] ?? null;
    const AutosaveInterval = parseInt(CSG.settings?.autoSaveInterval?._text).toFixed(0) ?? null;
    const SlotUsage = parseInt(CSG.slotSystem?._attributes?.slotUsage).toLocaleString('en-US') ?? null;

    // Stats embed
    statsEmbed.setAuthor({ name: `${DSS.slots.used}/${DSS.slots.capacity}` })
        .setColor(client.config.embedColorGreen)
        .setDescription(DSS.slots.used ? playerInfo.join('\n') : '*No players online*')
        .setFields({ name: `**Server Statistics**`, value: [
            `**Money:** $${Money}`,
            `**In-game time:** ${IngameTimeHrs}:${IngameTimeMins}`,
            `**Timescale:** ${Timescale}x`,
            `**Playtime:** ${playTimeHrs}hrs (${PlaytimeFormatted})`,
            `**Map:** ${DSS.server.mapName}`,
            `**Seasonal growth:** ${Seasons}`,
            `**Autosave interval:** ${AutosaveInterval} min`,
            `**Game version:** ${DSS.server.version}`,
            `**Slot usage:** ${SlotUsage}`
        ].join('\n') });
    if (DSS.slots.used === DSS.slots.capacity) {
        statsEmbed.setColor(client.config.embedColorRed);
    } else if (DSS.slots.used > 9) statsEmbed.setColor(client.config.embedColorYellow);

    statsMsgEdit();
    
    // Logs
    if (!DSS.server.name) {
        if (client.FSCache[serverAcro].status === 'online') logChannel.send({ embeds: [serverStatusEmbed('offline')] });
        client.FSCache[serverAcro].status = 'offline';
    } else {
        if (client.FSCache[serverAcro].status === 'offline') {
            logChannel.send({ embeds: [serverStatusEmbed('online')] });
            justStarted = true;
        }
        client.FSCache[serverAcro].status = 'online';
    }

    if (!justStarted) {
        if (serverAcro !== 'MF') adminCheck();
        log();
        
        const DB: Array<number> = JSON.parse(fs.readFileSync(`../databases/${serverAcro}PlayerData.json`, 'utf8'));
        DB.push(DSS.slots.used);
        fs.writeFileSync(`../databases/${serverAcro}PlayerData.json`, JSON.stringify(DB));
        if (DSS.slots.players.some(x=>x.isAdmin)) client.FSCache[serverAcro].lastAdmin = Date.now();

        client.FSCache[serverAcro].players = newPlayers;
    }
}

export function FSLoopAll(client: YClient) {
    const embed = new client.embed().setColor(client.config.embedColor);
    const totalCount = <number[]>[];

    for (const server of Object.entries(client.FSCache)) {
        const playerInfo: string[] = [];
        const serverSlots = server[1].players.length;
        totalCount.push(serverSlots);

        for (const player of server[1].players) {
            const playTimeHrs = Math.floor(player.uptime / 60);
            const playTimeMins = (player.uptime % 60).toString().padStart(2, '0');

            playerInfo.push(`\`${player.name}\` ${decorators(client, player)} **|** ${playTimeHrs}:${playTimeMins}`);
        }
        if (playerInfo.length > 0) embed.addFields({ name: `${server[0]} - ${serverSlots}/16`, value: playerInfo.join('\n') });
    }

    client.getChan('juniorAdminChat').messages.edit(client.config.mainServer.FSLoopMsgId, {
        content: `\`\`\`js\n['${client.whitelist._content.join("', '")}']\`\`\`Updates every 30 seconds`,
        embeds: [embed.setTitle(totalCount.reduce((a, b) => a + b, 0) + ' online')]
    }).catch(() => client.log('\x1b[31m', 'FSLoopAll invalid msg'));
}