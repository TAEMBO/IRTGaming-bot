import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
import fs from 'node:fs';
import path from 'node:path';
import canvas from 'canvas';
import { db_playerTimes_format, FSURLs, FS_data} from '../interfaces'

async function FSstatsAll(client: YClient, serverURLdss: string, embed: Discord.EmbedBuilder, totalCount: Array<number>, failedFooter: Array<string>, serverAcro: string) {
    let serverName;
    try {
        serverName = await fetch(serverURLdss, { signal: AbortSignal.timeout(4000), headers: { 'User-Agent': 'IRTBot/StatsAll' } });
    } catch (err) {
        console.log(client.timeLog('\x1b[31m'), `Stats all; ${serverAcro} failed`);
        failedFooter.push(`Failed to fetch ${serverAcro}`);
        return;
    }

    const DSSFetch = await serverName.json() as FS_data;
    if (DSSFetch.slots.used !== 0) {
        totalCount.push(DSSFetch.slots.used)
        const playerInfo: Array<string> = [];

        DSSFetch.slots.players.filter((x)=>x.isUsed).forEach((player) => {
            const playTimeHrs = Math.floor(player.uptime / 60);
            const playTimeMins = (player.uptime % 60).toString().padStart(2, '0');
            const inWl = client.watchList._content.find((y: Array<string>) => y[0] == player.name);
            let decorators = player.isAdmin ? ':detective:' : ''; // Tag for if player is admin
            decorators += client.FMstaff._content.includes(player.name) ? ':farmer:' : ''; // Tag for if player is FM
            decorators += client.TFstaff._content.includes(player.name) ? ':angel:' : ''; // Tag for if player is TF
            decorators += inWl ? '⛔' : ''; // Tag for if player is on watchList

            playerInfo.push(`\`${player.name}\` ${decorators} **|** ${playTimeHrs}:${playTimeMins}`);
        })
        const serverSlots = `${DSSFetch.slots.used}/${DSSFetch.slots.capacity}`;
        const serverTimeHrs = Math.floor(DSSFetch.server.dayTime / 3600 / 1000).toString().padStart(2, '0');
        const serverTimeMins = Math.floor((DSSFetch.server.dayTime / 60 / 1000) % 60).toString().padStart(2, '0');
        embed.addFields({name: `${DSSFetch.server.name.replace('! ! IRTGaming|', '')} - ${serverSlots} - ${serverTimeHrs}:${serverTimeMins}`, value: `${playerInfo.join("\n")}`})
    }
}
async function FSstats(client: YClient, interaction: Discord.CommandInteraction, serverURLdss: string, serverAcro: string) {

    const playerInfo: Array<string> = [];
    let FSFetch;
    let Color = client.config.embedColorGreen;

    try {
        FSFetch = await fetch(serverURLdss, { signal: AbortSignal.timeout(2000), headers: { 'User-Agent': 'IRTBot/Stats' } });
    } catch (err) {
        console.log(client.timeLog('\x1b[31m'), `Stats ${serverAcro.toUpperCase()} failed`);
        return interaction.reply('Server did not respond');
    }

    const FSserver = await FSFetch.json() as FS_data;

    if (FSserver.slots.used === FSserver.slots.capacity) {
        Color = client.config.embedColorRed;
    } else if (FSserver.slots.used > 9) {
        Color = client.config.embedColorYellow;
    }

    const data = JSON.parse(fs.readFileSync(path.join(__dirname, `../databases/${serverAcro.toUpperCase()}PlayerData.json`), {encoding: 'utf8'})).slice(client.FSCache.statsGraph);

    // handle negative days
    data.forEach((change: number, i: number) => {
        if (change < 0) data[i] = data[i - 1] || data[i + 1] || 0;
    });
    
    const first_graph_top = 16;
    const second_graph_top = 16;
    const textSize = 40;
    const img = canvas.createCanvas(1500, 750);
    const ctx = img.getContext('2d');

    const graphOrigin = [15, 65];
    const graphSize = [1300, 630];
    const nodeWidth = graphSize[0] / (data.length - 1);
    ctx.fillStyle = '#36393f';
    ctx.fillRect(0, 0, img.width, img.height);

    // grey horizontal lines
    ctx.lineWidth = 5;

    let interval_candidates = [];
    for (let i = 4; i < 10; i++) {
        const interval = first_graph_top / i;
        if (Number.isInteger(interval)) {
            let intervalString = interval.toString();
            const reference_number = i * Math.max(intervalString.split('').filter(x => x === '0').length / intervalString.length, 0.3) * (['1', '2', '4', '5', '6', '8'].includes(intervalString[0]) ? 1.5 : 0.67)
            interval_candidates.push([interval, i, reference_number]);
        }
    }
    const chosen_interval = interval_candidates.sort((a, b) => b[2] - a[2])[0];

    const previousY: Array<number> = [];

    ctx.strokeStyle = '#202225';
    for (let i = 0; i <= chosen_interval[1]; i++) {
        const y = graphOrigin[1] + graphSize[1] - (i * (chosen_interval[0] / second_graph_top) * graphSize[1]);
        if (y < graphOrigin[1]) continue;
        const even = ((i + 1) % 2) === 0;
        if (even) ctx.strokeStyle = '#2c2f33';
        ctx.beginPath();
        ctx.lineTo(graphOrigin[0], y);
        ctx.lineTo(graphOrigin[0] + graphSize[0], y);
        ctx.stroke();
        ctx.closePath();
        if (even) ctx.strokeStyle = '#202225';
        previousY.push(y, i * chosen_interval[0]);
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


    function getYCoordinate(value: number) {
        return ((1 - (value / second_graph_top)) * graphSize[1]) + graphOrigin[1];
    }
    
    const gradient = ctx.createLinearGradient(0, graphOrigin[1], 0, graphOrigin[1] + graphSize[1]);
    gradient.addColorStop(1 / 16, client.config.embedColorRed as string);
    gradient.addColorStop(5 / 16, client.config.embedColorYellow as string);
    gradient.addColorStop(12 / 16, client.config.embedColorGreen as string);
    
    let lastCoords: Array<number> = [];
    data.forEach((curPC: number /* current player count */, i: number) => {
        if (curPC < 0) curPC = 0;
        const x = i * nodeWidth + graphOrigin[0];
        const y = getYCoordinate(curPC);
        const nexPC /* next player count */ = data[i + 1];
        const prvPC /* previous player count */ = data[i - 1];
        ctx.strokeStyle = gradient;
        ctx.beginPath();
        if (lastCoords.length > 0) ctx.moveTo(lastCoords[0], lastCoords[1]);
        // if the line being drawn is horizontal, make it go until it has to go down
        if (y === lastCoords[1]) {
            let newX = x;
            for (let j = i + 1; j <= data.length; j++) {
                if (data[j] === curPC) newX += nodeWidth; else break;
            }
            ctx.lineTo(newX, y);
        } else {
            ctx.lineTo(x, y);
        }
        lastCoords = [x, y];
        ctx.stroke();
        ctx.closePath();
    
        if (curPC === prvPC && curPC === nexPC) {
            return; // no ball because no vertical difference to next or prev point
        } else {
            // ball
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, ctx.lineWidth * 1.3, 0, 2 * Math.PI)
            ctx.closePath();
            ctx.fill();
        }
    });

    // draw text
    ctx.font = '400 ' + textSize + 'px sans-serif';
    ctx.fillStyle = 'white';

    // highest value
    if (!isNaN(previousY.at(-2) as number)) {
        const maxx = graphOrigin[0] + graphSize[0] + textSize / 2;
        const maxy = (previousY.at(-2) as number) + (textSize / 3);
        ctx.fillText((previousY.at(-1) as number).toLocaleString('en-US'), maxx, maxy);
    }

    // lowest value
    const lowx = graphOrigin[0] + graphSize[0] + textSize / 2;
    const lowy = graphOrigin[1] + graphSize[1] + (textSize / 3);
    ctx.fillText('0 players', lowx, lowy);
    
    // 30d
    ctx.fillText('30 min ago', lastMonthStart, graphOrigin[1] - (textSize / 2));
    
    // time ->
    const tx = graphOrigin[0] + (textSize / 2);
    const ty = graphOrigin[1] + graphSize[1] + (textSize);
    ctx.fillText('time ->', tx, ty);

    FSserver.slots.players.filter((x) => x.isUsed).forEach((player) => {
        const playTimeHrs = Math.floor(player.uptime / 60);
        const playTimeMins = (player.uptime % 60).toString().padStart(2, '0');
        const inWl = client.watchList._content.find((y: Array<string>) => y[0] == player.name);
        let decorators = player.isAdmin ? ':detective:' : ''; // Tag for if player is admin
        decorators += client.FMstaff._content.includes(player.name) ? ':farmer:' : ''; // Tag for if player is FM
        decorators += client.TFstaff._content.includes(player.name) ? ':angel:' : ''; // Tag for if player is TF
        decorators += inWl ? '⛔' : ''; // Tag for if player is on watchList

        playerInfo.push(`\`${player.name}\` ${decorators} **|** ${playTimeHrs}:${playTimeMins}`);
    })
    const Image = new client.attachmentBuilder(img.toBuffer(), {name: "FSStats.png"});
    const serverSlots = `${FSserver.slots.used}/${FSserver.slots.capacity}`;
    const serverTimeHrs = Math.floor(FSserver.server.dayTime / 3600 / 1000).toString().padStart(2, '0');
    const serverTimeMins = Math.floor((FSserver.server.dayTime / 60 / 1000) % 60).toString().padStart(2, '0');
    const embed = new client.embed()
        .setAuthor({name: `${serverSlots} - ${serverTimeHrs}:${serverTimeMins}`})
        .setTitle(FSserver.server.name.length == 0 ? 'Offline' : FSserver.server.name)
        .setDescription(FSserver.slots.used == 0 ? '*No players online*' : playerInfo.join("\n"))
        .setImage('attachment://FSStats.png')
        .setColor(Color)
    if (FSserver.slots.players.filter((x)=> x.isAdmin).length == 0 && client.FSCache.servers[serverAcro].lastAdmin) embed.setTimestamp(client.FSCache.servers[serverAcro].lastAdmin).setFooter({text: 'Admin last on'});

    interaction.reply({embeds: [embed], files: [Image]}).catch(() => (interaction.channel as Discord.TextChannel).send({embeds: [embed], files: [Image]}));
}

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        if (['891791005098053682', '729823615096324166'].includes((interaction.channel as Discord.TextChannel).id) && !client.isMPStaff(interaction.member)) return interaction.reply({content: 'This command has [restrictions](https://discord.com/channels/552565546089054218/891791005098053682/991799952084828170) set, please use <#552583841936834560> for `/stats` commands.', ephemeral: true}); 
        const subCmd = interaction.options.getSubcommand() as 'ps' | 'pg' | 'all' | 'playertimes';
        let failedFooter: Array<string> = [];

        if (subCmd === 'all') {
            await interaction.deferReply();
            const embed = new client.embed().setColor(client.config.embedColor);
            const totalCount: Array<number> = [];
            let sum;

            await Promise.all([
                FSstatsAll(client, client.tokens.fs.ps.dss, embed, totalCount, failedFooter, 'PS'),
                FSstatsAll(client, client.tokens.fs.pg.dss, embed, totalCount, failedFooter, 'PG'),
                //FSstatsAll(client, client.tokens.mf.dss, embed, totalCount, failedFooter, 'MF')
            ]);

            if (totalCount.length == 0) {
                sum = 0;
            } else {
                sum = totalCount.reduce(function (previousValue, currentValue) {
                     return previousValue + currentValue;
                 });
            }
            if (failedFooter.length != 0) embed.setFooter({text: failedFooter.join(', ')});

            embed.setTitle(`All Servers: ${sum} online`);
            interaction.editReply({embeds: [embed]});
        } else if (subCmd === 'playertimes') {
            const player = interaction.options.getString('name');
            
            if (!player) {
                const playerTimesData = Object.entries<db_playerTimes_format>(client.playerTimes._content).sort((a, b) => (b[1].time as number) - (a[1].time as number)).slice(0, 20);
                const leaderboard = playerTimesData.map((x, i) => [
                    `**${i + 1}.** \`${x[0]}\``,
                    client.FMstaff._content.includes(x[0]) ? ':farmer:' : '',
                    client.TFstaff._content.includes(x[0]) ? ':angel:' : '',
                    ' - ',
                    client.formatTime(((x[1].time as number)*60*1000), 3, { commas: true, longNames: false })
                ].join('')).join('\n');
                interaction.reply({embeds: [new client.embed()
                    .setColor(client.config.embedColor)
                    .setDescription(`Top 20 players with the most time spent\non IRTGaming FS22 servers since\n<t:1672560000>\n\n${leaderboard}`)
                ]});
            } else {
                const playerData = client.playerTimes.getPlayer(player);
                let resultText;
                if (!playerData) {
                    resultText = ` has no logged play time.`;
                } else {
                    resultText = `'s total time is **${client.formatTime(playerData.time*60*1000, 3, { commas: true, longNames: false })}** and the last time they were on was <t:${playerData.lastOn}:R>.`;
                }
                interaction.reply(`\`${player}\`${resultText}`);
            }
        } else {
            FSstats(client, interaction, client.tokens.fs[subCmd].dss, subCmd);
        }
    },
    data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Gets info on an FS22 server")
    .addSubcommand((optt)=>optt
        .setName("all")
        .setDescription("Server stats for all servers")
    )
    .addSubcommand((optt)=>optt
        .setName("ps")
        .setDescription("Public Silage server stats")
    )
    .addSubcommand((optt)=>optt
        .setName("pg")
        .setDescription("Public Grain server stats")
    )
    //.addSubcommand((optt)=>optt
    //    .setName("mf")
    //    .setDescription("Multi Farm server stats")
    //)
    .addSubcommand((optt)=>optt
        .setName("playertimes")
        .setDescription("Player time data")
        .addStringOption((opt)=>opt
            .setName("name")
            .setDescription("Fetch total time for a player")
            .setRequired(false))
    )
};
