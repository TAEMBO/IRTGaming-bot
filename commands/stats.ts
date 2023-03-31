import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
import fs from 'node:fs';
import canvas from 'canvas';
import { FS_data } from '../interfaces.js';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        if (['891791005098053682', '729823615096324166'].includes(interaction.channel?.id as string) && !client.isMPStaff(interaction.member)) return interaction.reply({content: 'This command has [restrictions](https://discord.com/channels/552565546089054218/891791005098053682/991799952084828170) set, please use <#552583841936834560> for `/stats` commands.', ephemeral: true}); 
        const subCmd = interaction.options.getSubcommand() as 'ps' | 'pg' | 'mf' | 'all' | 'playertimes';

        async function FSstats() {
            const FSdss: FS_data = await fetch(client.tokens.fs[subCmd].dss, { signal: AbortSignal.timeout(2000), headers: { 'User-Agent': 'IRTBot/Stats' } }).then(res => res.json()).catch(() => {
                console.log(client.timeLog('\x1b[31m'), `Stats ${subCmd.toUpperCase()} failed`);
                return interaction.reply('Server did not respond');
            });

            const data: Array<number> = JSON.parse(fs.readFileSync(`../databases/${subCmd.toUpperCase()}PlayerData.json`, 'utf8')).slice(client.config.statsGraphSize);
        
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
        
            const getYCoordinate = (value: number) => ((1 - (value / second_graph_top)) * graphSize[1]) + graphOrigin[1];
            
            const gradient = ctx.createLinearGradient(0, graphOrigin[1], 0, graphOrigin[1] + graphSize[1]);
            gradient.addColorStop(1 / 16, client.config.embedColorRed);
            gradient.addColorStop(5 / 16, client.config.embedColorYellow);
            gradient.addColorStop(12 / 16, client.config.embedColorGreen);
            
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
                } else ctx.lineTo(x, y);
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

            const playerInfo: Array<string> = [];
            const watchList = await client.watchList._content.find();
            let Color = client.config.embedColorGreen;
        
            if (FSdss.slots.used === FSdss.slots.capacity) {
                Color = client.config.embedColorRed;
            } else if (FSdss.slots.used > 9) Color = client.config.embedColorYellow;
        
            FSdss.slots.players.filter(x=>x.isUsed).forEach(player => {
                const playTimeHrs = Math.floor(player.uptime / 60);
                const playTimeMins = (player.uptime % 60).toString().padStart(2, '0');
                const inWl = watchList.some(x => x._id === player.name);
                let decorators = player.isAdmin ? ':detective:' : ''; // Tag for if player is admin
                decorators += client.FMlist._content.includes(player.name) ? ':farmer:' : ''; // Tag for if player is FM
                decorators += client.TFlist._content.includes(player.name) ? ':angel:' : ''; // Tag for if player is TF
                decorators += inWl ? '⛔' : ''; // Tag for if player is on watchList
        
                playerInfo.push(`\`${player.name}\` ${decorators} **|** ${playTimeHrs}:${playTimeMins}`);
            });
            const Image = new client.attachmentBuilder(img.toBuffer(), { name: "FSStats.png" });
            const serverSlots = `${FSdss.slots.used}/${FSdss.slots.capacity}`;
            const serverTimeHrs = Math.floor(FSdss.server.dayTime / 3600 / 1000).toString().padStart(2, '0');
            const serverTimeMins = Math.floor((FSdss.server.dayTime / 60 / 1000) % 60).toString().padStart(2, '0');
            const embed = new client.embed()
                .setAuthor({name: `${serverSlots} - ${serverTimeHrs}:${serverTimeMins}`})
                .setTitle(FSdss.server.name.length == 0 ? 'Offline' : FSdss.server.name)
                .setDescription(FSdss.slots.used == 0 ? '*No players online*' : playerInfo.join("\n"))
                .setImage('attachment://FSStats.png')
                .setColor(Color);
            if (FSdss.slots.players.filter(x=>x.isAdmin).length === 0 && client.FSCache[subCmd].lastAdmin) embed.setTimestamp(client.FSCache[subCmd].lastAdmin).setFooter({text: 'Admin last on'});
        
            interaction.reply({embeds: [embed], files: [Image]}).catch(() => interaction.channel?.send({embeds: [embed], files: [Image]}) );
        }

        if (subCmd === 'all') {
            await interaction.deferReply();
            const embed = new client.embed().setColor(client.config.embedColor);
            const failedFooter: Array<string> = [];
            const totalCount: Array<number> = [];

            async function FSstatsAll(serverAcro: string) {
                const FSdss: FS_data = await fetch(client.tokens.fs[serverAcro.toLowerCase()].dss, { signal: AbortSignal.timeout(4000), headers: { 'User-Agent': 'IRTBot/StatsAll' } }).then(res => res.json()).catch(() => {
                    console.log(client.timeLog('\x1b[31m'), `Stats all; ${serverAcro} failed`);
                    failedFooter.push(`Failed to fetch ${serverAcro}`);
                    return;
                });

                if (FSdss.slots.used === 0) return;

                totalCount.push(FSdss.slots.used);
                const playerInfo: Array<string> = [];
                const watchList = await client.watchList._content.find();
            
                FSdss.slots.players.filter(x=>x.isUsed).forEach(player => {
                    const playTimeHrs = Math.floor(player.uptime / 60);
                    const playTimeMins = (player.uptime % 60).toString().padStart(2, '0');
                    const inWl = watchList.some(x => x._id === player.name);
                    let decorators = player.isAdmin ? ':detective:' : ''; // Tag for if player is admin
                    decorators += client.FMlist._content.includes(player.name) ? ':farmer:' : ''; // Tag for if player is FM
                    decorators += client.TFlist._content.includes(player.name) ? ':angel:' : ''; // Tag for if player is TF
                    decorators += inWl ? '⛔' : ''; // Tag for if player is on watchList
        
                    playerInfo.push(`\`${player.name}\` ${decorators} **|** ${playTimeHrs}:${playTimeMins}`);
                });
                const serverSlots = `${FSdss.slots.used}/${FSdss.slots.capacity}`;
                embed.addFields({name: `${FSdss.server.name.replace('! ! IRTGaming|', '')} - ${serverSlots}`, value: `${playerInfo.join("\n")}`, inline: true});
            }
            await Promise.all([FSstatsAll('PS'), FSstatsAll('PG'), FSstatsAll('MF')]);

            embed.setTitle(`All Servers: ${totalCount.reduce((a, b) => a + b, 0)} online`).setFooter(failedFooter.length > 0 ? { text: failedFooter.join(', ') } : null);
            interaction.editReply({embeds: [embed]});
        } else if (subCmd === 'playertimes') {
            client.playerTimes._content.find().then(playersData => {
                const sortedData = playersData.sort((a, b) => b.time - a.time);
                const player = interaction.options.getString('name');

                const leaderboard = (data: Array<typeof sortedData[0]>, isFirstField: boolean) => data.map((x, i) => [
                    `**${i + (isFirstField ? 1 : 26)}.** \`${x._id}\``,
                    client.FMlist._content.includes(x._id) ? ':farmer:' : '',
                    client.TFlist._content.includes(x._id) ? ':angel:' : '',
                    ' - ',
                    client.formatTime((x.time * 60 * 1000), 3, { commas: true, longNames: false })
                ].join('')).join('\n');

                if (player) {
                    const playerData = playersData.find(x => x._id === player);
                    const isOnPS = client.FSCache.ps.players.some(x => x.name === player);
                    const isOnPG = client.FSCache.pg.players.some(x => x.name === player);
                    const isOnMF = client.FSCache.mf.players.some(x => x.name === player);
    
                    if (playerData) {
                        let lastOnText: string;
    
                        if (isOnPS) {
                            lastOnText = 'Right now (Public Silage)';
                        } else if (isOnPG) {
                            lastOnText = 'Right now (Public Grain)';
                        } else if (isOnMF) {
                            lastOnText = 'Right now (Multi Farm)';
                        } else lastOnText = `<t:${playerData.lastOn}:R>`;

                        interaction.reply({embeds: [new client.embed()
                            .setColor(client.config.embedColor)
                            .setTitle([
                                `Player - \`${playerData._id}\``,
                                `Total time - **${client.formatTime(playerData.time * 60 * 1000, 3, { commas: true, longNames: false })}**`,
                                `Leaderboard position - **#${playersData.indexOf(playerData) + 1}**`,
                                `Time last on - **${lastOnText}**`
                            ].join('\n'))
                        ]});
                    } else interaction.reply('No data found with that name. [Find out why.](https://canary.discord.com/channels/552565546089054218/552583841936834560/1087422094519836792)');

                } else interaction.reply({embeds: [new client.embed()
                    .setColor(client.config.embedColor)
                    .setDescription(`Top 50 players with the most time spent on IRTGaming FS22 servers since\n<t:1672560000>`)
                    .addFields(
                        { name: '\u200b', value: leaderboard(sortedData.slice(0, 25), true), inline: true },
                        { name: '\u200b', value: leaderboard(sortedData.slice(25, 50), false), inline: true })
                ]});
            });
        } else FSstats();
    },
    data: new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Gets info on an FS22 server")
        .addSubcommand((optt)=>optt
            .setName("all")
            .setDescription("Server stats for all servers"))
        .addSubcommand((optt)=>optt
            .setName("ps")
            .setDescription("Public Silage server stats"))
        .addSubcommand((optt)=>optt
            .setName("pg")
            .setDescription("Public Grain server stats"))
        .addSubcommand((optt)=>optt
            .setName("mf")
            .setDescription("Multi Farm server stats"))
        .addSubcommand((optt)=>optt
            .setName("playertimes")
            .setDescription("Player time data")
            .addStringOption((opt)=>opt
                .setName("name")
                .setDescription("The in-game name of the player to get stats for")
                .setRequired(false)))
};
