import Discord from "discord.js";
import YClient from "./client";
import { FS_careerSavegame, FS_data, FS_player } from "./interfaces";
import fs from "node:fs";

export default async (client: YClient, serverURLdss: string, serverURLcsg: string, Channel: string, Message: string, serverAcro: string) => {
    function wlEmbed(playerName: string, joinLog: boolean, wlReason?: string) {
        const embed = new client.embed()
            .setTitle('WATCHLIST')
            .setDescription(`\`${playerName}\` ${joinLog ? 'joined' : 'left'} **${serverAcro}** at <t:${now}:t>`);
        if (joinLog) {
            embed.setColor(client.config.embedColorGreen).setFooter({text: `Reason: ${wlReason}`});
        } else embed.setColor(client.config.embedColorRed);
    
        return embed;
    }
    function logEmbed(player: FS_player, joinLog: boolean) {
        const playTimeHrs = Math.floor(player.uptime / 60);
        const playTimeMins = (player.uptime % 60).toString().padStart(2, '0');
        let decorators = player.isAdmin ? ':detective:' : ''; // Tag for if player is admin
        decorators += client.FMlist._content.includes(player.name) ? ':farmer:' : ''; // Tag for if player is FM
        decorators += client.TFlist._content.includes(player.name) ? ':angel:' : ''; // Tag for if player is TF
        const embed = new client.embed().setDescription(`\`${player.name}\`${decorators} ${joinLog ? 'joined': 'left'} **${serverAcro}** at <t:${now}:t>`);
    
        if (joinLog) {
            embed.setColor(client.config.embedColorGreen);
        } else embed.setColor(client.config.embedColorRed).setFooter({text: `Playtime: ${playTimeHrs}:${playTimeMins}`});
    
        return embed;
    }
    function adminCheck(ArrayNew: Array<FS_player>, ArrayOld: Array<FS_player>) {
        const Whitelist: Array<string> = JSON.parse(fs.readFileSync('./databases/adminWhitelist.json', 'utf8'));
    
        ArrayNew.filter(x => {
            !ArrayOld.some(y => {
                if (y.name === x.name && !y.isAdmin && x.isAdmin && !Whitelist.includes(x.name) && !client.FMlist._content.includes(x.name)) {
                    (client.channels.resolve('830916009107652630') as Discord.TextChannel).send({embeds: [new client.embed()
                        .setTitle('UNKNOWN ADMIN LOGIN')
                        .setDescription(`\`${x.name}\` on **${serverAcro}** at <t:${now}>`)
                        .setColor('#ff4d00')]});
                }
            });
        });
    }
    function log(ArrayNew: Array<FS_player>, ArrayOld: Array<FS_player>) {
        // Filter for players leaving
        ArrayOld.filter(x => !ArrayNew.some(y => y.name === x.name)).forEach(async player => {
            const inWl = await client.watchList._content.findById(player.name);
            if (inWl) wlChannel.send({embeds: [wlEmbed(inWl._id, false)]}); // Hopefully that person got banned
            
            if (player.uptime > 0) client.playerTimes.addPlayerTime(player.name, player.uptime); // Add playerTimes data
            logChannel.send({embeds: [logEmbed(player, false)]});
        });
                    
        // Filter for players joining
        let playerObj;
        if (ArrayOld.length == 0 && (client.uptime as number) > 33000) {
            playerObj = ArrayNew;
        } else if (ArrayOld.length != 0) playerObj = ArrayNew.filter(y => !ArrayOld.some(z => z.name === y.name));
     
        if (playerObj) playerObj.forEach(async x => {
            const inWl = await client.watchList._content.findById(x.name);
            const guild = client.guilds.cache.get(client.config.mainServer.id) as Discord.Guild;
            if (client.config.mainServer.id == '552565546089054218' && inWl) {
                const filterWLPings = client.config.watchListPings.filter(x => !(guild.members.cache.get(x) as Discord.GuildMember).roles.cache.has(client.config.mainServer.roles.loa)).map(x=>`<@${x}>`).join(" ");
                wlChannel.send({ content: filterWLPings, embeds: [wlEmbed(inWl._id, true, inWl.reason)] }); // Oh no, go get em Toast
            }
            logChannel.send({embeds: [logEmbed(x, true)]});
        });
    }

    const wlChannel = client.channels.resolve(client.config.mainServer.channels.watchlist) as Discord.TextChannel;
    const logChannel = client.channels.resolve(client.config.mainServer.channels.fslogs) as Discord.TextChannel;
    const statsMsg = await (client.channels.resolve(Channel) as Discord.TextChannel).messages.fetch(Message);
    const xjs = require('xml-js');
    const now = Math.round(Date.now() / 1000);
    const playerInfo: Array<string> = [];
    const statsEmbed = new client.embed();
    let justStarted = false;

    const DSSFetch: void | Response = await fetch(serverURLdss, { signal: AbortSignal.timeout(7000), headers: { 'User-Agent': 'IRTBot/FSLoop' } }).catch((err: Error) => {
        console.log(client.timeLog('\x1b[31m'), `${serverAcro} dss ${err.message}`);
    }); // Fetch dedicated-server-stats.json

    const CSGFetch: void | Response = await fetch(serverURLcsg, { signal: AbortSignal.timeout(7000), headers: { 'User-Agent': 'IRTBot/FSLoop' } }).catch((err: Error) => {
        console.log(client.timeLog('\x1b[31m'), `${serverAcro} csg ${err.message}`);
    }); // Fetch dedicated-server-savegame.html

    if (DSSFetch == undefined || CSGFetch == undefined || CSGFetch.status == 204) { // Blame Red
        if (CSGFetch?.status == 204) {
            statsEmbed.setImage('https://http.cat/204');
            console.log(client.timeLog('\x1b[31m'), `${serverAcro} csg empty content`);
        };
        statsEmbed.setTitle('Host not responding').setColor(client.config.embedColorRed);
        statsMsg.edit({embeds: [statsEmbed]});
        return;
    } 
    const FSdss = await DSSFetch.json() as FS_data;
    const FScsg = xjs.xml2js(await CSGFetch.text(), { compact: true }).careerSavegame as FS_careerSavegame;
    const Players = FSdss.slots.players.filter(x=>x.isUsed);
    const watchList = await client.watchList._content.find();

    Players.forEach(player => {
        const playTimeHrs = Math.floor(player.uptime / 60);
        const playTimeMins = (player.uptime % 60).toString().padStart(2, '0');
        const inWl = watchList.some(x => x._id === player.name);
        let decorators = player.isAdmin ? ':detective:' : ''; // Tag for if player is admin
        decorators += client.FMlist._content.includes(player.name) ? ':farmer:' : ''; // Tag for if player is FM
        decorators += client.TFlist._content.includes(player.name) ? ':angel:' : ''; // Tag for if player is TF
        decorators += inWl ? '⛔' : ''; // Tag for if player is on watchList

        playerInfo.push(`\`${player.name}\` ${decorators} **|** ${playTimeHrs}:${playTimeMins}`);
    });

    // Data crunching for stats embed
    const Money = parseInt(FScsg.statistics?.money?._text).toLocaleString('en-US') ?? null;
    const IngameTimeHrs = Math.floor(FSdss.server?.dayTime / 3600 / 1000).toString().padStart(2, '0') ?? null;
    const IngameTimeMins = Math.floor((FSdss.server?.dayTime / 60 / 1000) % 60).toString().padStart(2, '0') ?? null;
    const Timescale = FScsg.settings?.timeScale?._text?.slice(0, -5) ?? null;
    const playTimeHrs = (parseInt(FScsg.statistics?.playTime?._text) / 60).toFixed(2) ?? null;
    const PlaytimeFormatted = client.formatTime((parseInt(FScsg.statistics?.playTime?._text) * 60 * 1000), 3, { commas: true, longNames: false }) ?? null;
    const Seasons = { '1': 'Yes 🔴', '2': 'No', '3':'Paused 🔴' }[FScsg.settings?.growthMode?._text] ?? null;
    const AutosaveInterval = parseInt(FScsg.settings?.autoSaveInterval?._text).toFixed(0) ?? null;
    const SlotUsage = parseInt(FScsg.slotSystem?._attributes?.slotUsage).toLocaleString('en-US') ?? null;

    // Stats embed
    statsEmbed.setAuthor({name: `${FSdss.slots.used}/${FSdss.slots.capacity}`})
        .setColor(client.config.embedColorGreen)
        .setDescription(FSdss.slots.used === 0 ? '*No players online*' : playerInfo.join("\n"))
        .addFields({name: `**Server Statistics**`, value: [
            `**Money:** $${Money}`,
            `**In-game time:** ${IngameTimeHrs}:${IngameTimeMins}`,
            `**Timescale:** ${Timescale}x`,
            `**Playtime:** ${playTimeHrs}hrs (${PlaytimeFormatted})`,
            `**Map:** ${FSdss.server.mapName}`,
            `**Seasonal growth:** ${Seasons}`,
            `**Autosave interval:** ${AutosaveInterval} min`,
            `**Game version:** ${FSdss.server.version}`,
            `**Slot usage:** ${SlotUsage}`
        ].join('\n')});
    if (FSdss.slots.used === FSdss.slots.capacity) {
        statsEmbed.setColor(client.config.embedColorRed);
    } else if (FSdss.slots.used > 9) statsEmbed.setColor(client.config.embedColorYellow);

    statsMsg.edit({embeds: [statsEmbed]});
    
    // Logs
    const serverStatusEmbed = (status: string) => new client.embed().setTitle(`${serverAcro} now ${status}`).setColor(client.config.embedColorYellow).setTimestamp();
    if (FSdss.server.name.length === 0) {
        if (client.FSCache[serverAcro.toLowerCase()].status === 'online') logChannel.send({embeds: [serverStatusEmbed('offline')]});
        client.FSCache[serverAcro.toLowerCase()].status = 'offline';
    } else {
        if (client.FSCache[serverAcro.toLowerCase()].status === 'offline') {
            logChannel.send({embeds: [serverStatusEmbed('online')]});
            justStarted = true;
        }
        client.FSCache[serverAcro.toLowerCase()].status = 'online';
    }

    if (!justStarted) {
        adminCheck(Players, client.FSCache[serverAcro.toLowerCase()].players);
        log(Players, client.FSCache[serverAcro.toLowerCase()].players);
        
        const DB: Array<number> = JSON.parse(fs.readFileSync(`./databases/${serverAcro}PlayerData.json`, 'utf8'));
        DB.push(FSdss.slots.used);
        fs.writeFileSync(`./databases/${serverAcro}PlayerData.json`, JSON.stringify(DB));
        if (FSdss.slots.players.filter(x=>x.isAdmin).length > 0) client.FSCache[serverAcro.toLowerCase()].lastAdmin = Date.now();

        client.FSCache[serverAcro.toLowerCase()].players = Players;
    }
}