const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require('discord.js');
const axios = require("axios");
const BLAKLIST = [
    '891791005098053682', //PS
    '729823615096324166', //PG
];

async function FSstatsAll(client, serverName, embed, totalCount) {
    if (serverName.data.slots.used !== 0) {
        totalCount.push(serverName.data.slots.used)
        const playerInfo = [];
        await serverName.data.slots.players.forEach(player => {
            if (player.name === undefined) return;
            playerInfo.push(`\`${player.name}\` ${(player.isAdmin ? ' :detective:' : '')}${(client.FMstaff._content.includes(player.name) ? ':farmer:' : '')}${(client.TFstaff._content.includes(player.name) ? ':angel:' : '')} **|** ${('0' + Math.floor(player.uptime/60)).slice(-2)}:${('0' + (player.uptime % 60)).slice(-2)}`);
            })
        embed.addFields(
            {name: `${serverName.data.server.name} - ${serverName.data.slots.used}/${serverName.data.slots.capacity} - ${('0' + Math.floor((serverName.data.server.dayTime/3600/1000))).slice(-2)}:${('0' + Math.floor((serverName.data.server.dayTime/60/1000)%60)).slice(-2)}`, value: `${playerInfo.join("\n")}`}
        )
    }
}

async function FSstats(client, interaction, serverName, DBName) {

    const embed = new client.embed()
    const playerInfo = [];
    let FSserver;
    let Color = client.config.embedColorGreen;

    try {
        FSserver = await axios.get(serverName, {timeout: 2000});
    } catch (err) {
        return interaction.reply('Server did not respond');
    }

    if (FSserver.data.slots.used === FSserver.data.slots.capacity) {
        Color = client.config.embedColorRed;
    } else if (FSserver.data.slots.used > 9) {
        Color = client.config.embedColorYellow;
    }

    const data = require(`../databases/${DBName}.json`).slice(-120)

    // handle negative days
    data.forEach((change, i) => {
        if (change < 0) data[i] = data[i - 1] || data[i + 1] || 0;
    });

    const maxValue = Math.max(...data);
    const maxValueArr = maxValue.toString().split('');
    
    const first_graph_top = 16;
    // console.log({ first_graph_top });
    
    const second_graph_top = 16;
    // console.log({ second_graph_top });

    const textSize = 32;

    const canvas = require('canvas');
    const fs = require('fs');
    const img = canvas.createCanvas(950, 450);
    const ctx = img.getContext('2d');

    const graphOrigin = [10, 50];
    const graphSize = [700, 360];
    const nodeWidth = graphSize[0] / (data.length - 1);
    ctx.fillStyle = '#36393f';
    ctx.fillRect(0, 0, img.width, img.height);

    // grey horizontal lines
    ctx.lineWidth = 3;

    let interval_candidates = [];
    for (let i = 4; i < 10; i++) {
        const interval = first_graph_top / i;
        if (Number.isInteger(interval)) {
            intervalString = interval.toString();
            const reference_number = i * Math.max(intervalString.split('').filter(x => x === '0').length / intervalString.length, 0.3) * (['1', '2', '4', '5', '6', '8'].includes(intervalString[0]) ? 1.5 : 0.67)
            interval_candidates.push([interval, i, reference_number]);
        }
    }
    // console.log({ interval_candidates });
    const chosen_interval = interval_candidates.sort((a, b) => b[2] - a[2])[0];
    // console.log({ chosen_interval });

    let previousY;

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
        previousY = [y, i * chosen_interval[0]];
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
    ctx.lineWidth = 3;


    function getYCoordinate(value) {
        return ((1 - (value / second_graph_top)) * graphSize[1]) + graphOrigin[1];
    }
    
    function colorAtPlayercount(playercount) {
        if (playercount === first_graph_top) {
            return client.config.embedColorRed;
        } else if (playercount > 9) {
            return client.config.embedColorYellow;
        } else {return client.config.embedColorGreen;}
    }
    let lastCoords = [];
    data.forEach((val, i) => {
        ctx.beginPath();
        if (lastCoords.length > 0) ctx.moveTo(...lastCoords);
        if (val < 0) val = 0;
        const x = i * nodeWidth + graphOrigin[0];
        const y = getYCoordinate(val);
        const nextCoord = data[i+1];
        const lastCoord = data[i-1]
        ctx.lineTo(x, y);
        lastCoords = [x, y];
        ctx.stroke();
        ctx.strokeStyle = colorAtPlayercount(val);
        ctx.fillStyle = colorAtPlayercount(val);
        ctx.closePath();
        
        if (val === lastCoord && val === nextCoord) {
            return;
        } else {
            // ball
            ctx.beginPath();
            ctx.arc(x, y, ctx.lineWidth * 1.2, 0, 2 * Math.PI)
            ctx.closePath();
            ctx.fill();
        }
    
    });

    // draw text
    ctx.font = '400 ' + textSize + 'px sans-serif';
    ctx.fillStyle = 'white';

    // highest value
    const maxx = graphOrigin[0] + graphSize[0] + textSize;
    const maxy = previousY[0] + (textSize / 3);
    ctx.fillText(previousY[1].toLocaleString('en-US'), maxx, maxy);
    
    // lowest value
    const lowx = graphOrigin[0] + graphSize[0] + textSize;
    const lowy = graphOrigin[1] + graphSize[1] + (textSize / 3);
    ctx.fillText('0 players', lowx, lowy);
    
    // 30d
    ctx.fillText('30 min ago', lastMonthStart, graphOrigin[1] - (textSize / 3));
    
    // time ->
    const tx = graphOrigin[0] + (textSize / 2);
    const ty = graphOrigin[1] + graphSize[1] + (textSize);
    ctx.fillText('time ->', tx, ty);

    await FSserver.data.slots.players.forEach(player => {
    if (player.name === undefined) return;
    playerInfo.push(`\`${player.name}\` ${(player.isAdmin ? ' :detective:' : '')}${(client.FMstaff._content.includes(player.name) ? ':farmer:' : '')}${(client.TFstaff._content.includes(player.name) ? ':angel:' : '')} **|** ${('0' + Math.floor(player.uptime/60)).slice(-2)}:${('0' + (player.uptime % 60)).slice(-2)}`);
    })
    const Image = new Discord.MessageAttachment(img.toBuffer(), "FSStats.png")
    embed.setAuthor({name: `${FSserver.data.slots.used}/${FSserver.data.slots.capacity}`})
    embed.setTitle(FSserver.data.server.name)
    embed.setImage('attachment://FSStats.png')
    embed.setColor(Color)
    embed.setDescription(`${FSserver.data.slots.used === 0 ? 'No players online' : playerInfo.join("\n")}`);
    embed.setFooter({text: `In-game time: ${('0' + Math.floor((FSserver.data.server.dayTime/3600/1000))).slice(-2)}:${('0' + Math.floor((FSserver.data.server.dayTime/60/1000)%60)).slice(-2)} | Version: ${FSserver.data.server.version} | Map: ${FSserver.data.server.mapName}`});
    interaction.reply({embeds: [embed], files: [Image]})
}

module.exports = {
    run: async (client, interaction) => {
        if (!client.config.botSwitches.stats) return interaction.reply({content: '`/stats` commands are currently disabled.', ephemeral: true});
        if (BLAKLIST.includes(interaction.channel.id) && !client.isMPStaff(client, interaction.member)) return interaction.reply({content: 'This command has [restrictions](https://discord.com/channels/552565546089054218/891791005098053682/991799952084828170) set, please use <#552583841936834560> for `/stats` commands.', ephemeral: true}); 
        const subCmd = interaction.options.getSubcommand();

        if (subCmd === 'all') {
            let PS;
            let PG;
            let MF;
            
            // const msg = await interaction.reply({content: 'Loading <a:IRT_loading:660661301353381898>', fetchReply: true})
            try {
                PS = await axios.get(client.tokens.ps, {timeout: 1000});
            } catch (err) {
                console.log(`stats all; PS failed`)
            }
            try {
                PG = await axios.get(client.tokens.pg, {timeout: 1000});
            } catch (err) {
                console.log(`stats all; PG failed`)
            }
            try {
                MF = await axios.get(client.tokens.df, {timeout: 1000});
            } catch (err) {
                console.log(`stats all; MF failed`)
            }
            const totalCount = [];
            const embed = new client.embed()
                .setColor(client.config.embedColor)
                if (PS) {
                    await FSstatsAll(client, PS, embed, totalCount)
                } 
                if (PG) {
                    await FSstatsAll(client, PG, embed, totalCount)
                }
                if (MF) {
                    await FSstatsAll(client, MF, embed, totalCount)
                }

                let sum;
                if (totalCount.length === 0) {
                    sum = 0;
                } else {
                    sum = totalCount.reduce(function (previousValue, currentValue) {
                        return previousValue + currentValue;
                    });
                }

                embed.setTitle(`All Servers: ${sum} online`)
                //msg.edit({content: null, embeds: [embed]})
                interaction.reply({embeds: [embed]})
        } else if (subCmd === 'ps') {
            FSstats(client, interaction, client.tokens.ps, 'PSPlayerData');
        } else if (subCmd === 'pg') {
            FSstats(client, interaction, client.tokens.pg, 'PGPlayerData');
        } else if (subCmd === 'mf') {
            FSstats(client, interaction, client.tokens.df, 'MFPlayerData');
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
        .setDescription("Server stats for Public Silage")
    )
    .addSubcommand((optt)=>optt
        .setName("pg")
        .setDescription("Server stats for Public Grain")
    )
    .addSubcommand((optt)=>optt
        .setName("mf")
        .setDescription("Server stats for Multi Farm")
    )
};
