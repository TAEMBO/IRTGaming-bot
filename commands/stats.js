const {SlashCommandBuilder, AttachmentBuilder} = require('discord.js');
const axios = require("axios");

async function FSstatsAll(client, serverName, embed, totalCount) {
    if (serverName.data.slots.used !== 0) {
        totalCount.push(serverName.data.slots.used)
        const playerInfo = [];

        await serverName.data.slots.players.filter((x)=> x.isUsed !== false).forEach(player => {
            let wlPlayer = ''; // Tag for if player is on watchList
            client.watchList._content.forEach((x) => {
                if (x[0] === player.name) {
                    wlPlayer = '⛔';
                }
            })
            playerInfo.push(`\`${player.name}\` ${wlPlayer}${(player.isAdmin ? ' :detective:' : '')}${(client.FMstaff._content.includes(player.name) ? ':farmer:' : '')}${(client.TFstaff._content.includes(player.name) ? ':angel:' : '')} **|** ${(Math.floor(player.uptime/60))}:${('0' + (player.uptime % 60)).slice(-2)}`);
            })
        embed.addFields(
            {name: `${serverName.data.server.name.replace('! IRTGaming|24/7 ', '')} - ${serverName.data.slots.used}/${serverName.data.slots.capacity} - ${('0' + Math.floor((serverName.data.server.dayTime/3600/1000))).slice(-2)}:${('0' + Math.floor((serverName.data.server.dayTime/60/1000)%60)).slice(-2)}`, value: `${playerInfo.join("\n")}`}
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

    const data = require(`../databases/${DBName}.json`).slice(client.FSCache.statsGraph)

    // handle negative days
    data.forEach((change, i) => {
        if (change < 0) data[i] = data[i - 1] || data[i + 1] || 0;
    });
    
    const first_graph_top = 16;
    // console.log({ first_graph_top });
    
    const second_graph_top = 16;
    // console.log({ second_graph_top });

    const textSize = 40;

    const canvas = require('canvas');
    const fs = require('fs');
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
    ctx.lineWidth = 5;


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
    data.forEach((curPC /* current player count */, i) => {
        if (curPC < 0) curPC = 0;
        const x = i * nodeWidth + graphOrigin[0];
        const y = getYCoordinate(curPC);
        const nexPC /* next player count */ = data[i + 1];
        const prvPC /* previous player count */ = data[i - 1];
        const curColor = colorAtPlayercount(curPC); // color now
        const prvColor = colorAtPlayercount(prvPC); // color at last point
        if (curColor !== prvColor && !isNaN(prvPC) && lastCoords.length > 0) { // gradient should be used when the color between now and last point is not the same
            // gradient from now to last point
            const grd = ctx.createLinearGradient(...lastCoords, x, y);
            grd.addColorStop(0, colorAtPlayercount(prvPC)); // prev color at the beginning
            grd.addColorStop(1, colorAtPlayercount(curPC)); // cur color at the end
            // special case: playercount rises or falls rapidly accross all colors (eg. straight from red to green)
            if (curColor !== client.config.embedColorYellow && prvColor !== client.config.embedColorYellow) {
                const yellowY = getYCoordinate(10); // y coordinate at which line should be yellow
                const stop = (yellowY - lastCoords[1]) / (y - lastCoords[1]); // between 0 and 1, where is yellowY between y and nextPointCoords[1] ?
                grd.addColorStop(stop, client.config.embedColorYellow); // add a yellow stop to the gradient
            }
            ctx.strokeStyle = grd;
        } else {
            ctx.strokeStyle = colorAtPlayercount(curPC);
        }
        ctx.beginPath();
        if (lastCoords.length > 0) ctx.moveTo(...lastCoords);
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
            ctx.fillStyle = colorAtPlayercount(curPC);
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
    const maxx = graphOrigin[0] + graphSize[0] + textSize / 2;
    const maxy = previousY[0] + (textSize / 3);
    ctx.fillText(previousY[1].toLocaleString('en-US'), maxx, maxy);
    
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
    
    // canvas.loadImage('./databases/dss.jpg').then((image) => {
    //     ctx.drawImage(image, 0, 0)
    //   })

    await FSserver.data.slots.players.filter((x)=> x.isUsed !== false).forEach(player => {
        let wlPlayer = ''; // Tag for if player is on watchList
        client.watchList._content.forEach((x) => {
            if (x[0] === player.name) {
                wlPlayer = '⛔';
            }
        })
        playerInfo.push(`\`${player.name}\` ${wlPlayer}${(player.isAdmin ? ' :detective:' : '')}${(client.FMstaff._content.includes(player.name) ? ':farmer:' : '')}${(client.TFstaff._content.includes(player.name) ? ':angel:' : '')} **|** ${(Math.floor(player.uptime/60))}:${('0' + (player.uptime % 60)).slice(-2)}`);
    })
    const Image = new AttachmentBuilder(img.toBuffer(), {name: "FSStats.png"})
    embed.setAuthor({name: `${FSserver.data.slots.used}/${FSserver.data.slots.capacity} - ${('0' + Math.floor((FSserver.data.server.dayTime/3600/1000))).slice(-2)}:${('0' + Math.floor((FSserver.data.server.dayTime/60/1000)%60)).slice(-2)}`})
     if (FSserver.data.server.name.length !== 0) {embed.setTitle(FSserver.data.server.name)}
    embed.setImage('attachment://FSStats.png')
    embed.setColor(Color)
    embed.setDescription(`${FSserver.data.slots.used === 0 ? '*No players online*' : playerInfo.join("\n")}`);
    interaction.reply({embeds: [embed], files: [Image]})
}

module.exports = {
    run: async (client, interaction) => {
        if (!client.config.botSwitches.stats) return interaction.reply({content: '`/stats` commands are currently disabled.', ephemeral: true});
        if (['891791005098053682', '729823615096324166'].includes(interaction.channel.id) && !client.isMPStaff(client, interaction.member)) return interaction.reply({content: 'This command has [restrictions](https://discord.com/channels/552565546089054218/891791005098053682/991799952084828170) set, please use <#552583841936834560> for `/stats` commands.', ephemeral: true}); 
        const subCmd = interaction.options.getSubcommand();

        if (subCmd === 'all') {
            let PS;
            let PG;
            let MF;
            
            // const msg = await interaction.reply({content: 'Loading <a:IRT_loading:660661301353381898>', fetchReply: true})
            try {
                PS = await axios.get(client.tokens.ps.dss, {timeout: 1000});
            } catch (err) {
                console.log(`stats all; PS failed`)
            }
            try {
                PG = await axios.get(client.tokens.pg.dss, {timeout: 1000});
            } catch (err) {
                console.log(`stats all; PG failed`)
            }
            try {
                MF = await axios.get(client.tokens.mf.dss, {timeout: 1000});
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
            FSstats(client, interaction, client.tokens.ps.dss, 'PSPlayerData');
        } else if (subCmd === 'pg') {
            FSstats(client, interaction, client.tokens.pg.dss, 'PGPlayerData');
        } else if (subCmd === 'mf') {
            FSstats(client, interaction, client.tokens.mf.dss, 'MFPlayerData');
        } else if (subCmd === 'playertimes') {
            const embed = new client.embed()
                .setDescription(`Top 20 players with the most time spent on IRTGaming FS22 servers since <t:1664645628>\n\n${Object.entries(client.playerTimes._content).sort((a, b) => b[1] - a[1]).slice(0, 20).map((x, i) => `**${i + 1}.** \`${x[0]}\`${(client.FMstaff._content.includes(x[0]) ? ':farmer:' : '')}${(client.TFstaff._content.includes(x[0]) ? ':angel:' : '')}: ${client.formatTime((x[1]*60*1000), 3, { commas: true, longNames: false })}`).join('\n')}`)
                .setColor(client.config.embedColor)
            const player = interaction.options.getString('name');
            
            if (!player) {
                interaction.reply({embeds: [embed]});
            } else {
                const time = client.playerTimes.getPlayer(player);
                let result;
                if (time == 0) {
                    result = ` has no logged play time.`;
                } else {
                    result = `'s total time: **${client.formatTime(time*60*1000, 3, { commas: true, longNames: false })}**`;
                }
                interaction.reply(`\`${player}\`${result}`)
            }
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
    .addSubcommand((optt)=>optt
        .setName("mf")
        .setDescription("Multi Farm server stats")
    )
    .addSubcommand((optt)=>optt
        .setName("playertimes")
        .setDescription("Player time data")
        .addStringOption((opt)=>opt
            .setName("name")
            .setDescription("Fetch total time for a player")
            .setRequired(false))
    )
};
