const {Client} = require("discord.js");
const Discord = require("discord.js");
const fs = require("node:fs");
const database = require("./database");
const EventEmitter = require("node:events");
class YClient extends Client {
    constructor(options){
        super({
            intents: Object.keys(Discord.Intents.FLAGS),
            partials: ["MESSAGE", "REACTION", "CHANNEL"],
            disableEveryone: true
        })
        this.invites = new Map();
        this.config = require("./config.json");
        this.tokens = require("./tokens.json");
        this.embed = Discord.MessageEmbed;
        this.collection = Discord.Collection;
        this.messageCollector = Discord.MessageCollector;
        this.messageattachment = Discord.MessageAttachment;
        this.memberCount_LastGuildFetchTimestamp = 0;
        this.commands = new Discord.Collection();
        this.registery = [];
        this.setMaxListeners(100)
        this.bannedWords = new database("./databases/bannedWords.json", "array");
        this.userLevels = new database("./databases/userLevels.json", "object");
        this.dmForwardBlacklist = new database("./databases/dmforwardblacklist.json", "array");
        this.punishments = new database("./databases/punishments.json", "array");
        this.FMstaff = new database("./databases/FMstaff.json", "array");
        this.TFstaff = new database("./databases/TFstaff.json", "array");
        this.watchList = new database("./databases/watchList.json", "array");
        this.votes = new database("./databases/suggestvotes.json", "array");
        this.repeatedMessages = {};
        this.repeatedMessagesContent = new database("./databases/repeatedMessagesContent.json", "array");
    }
    async init(){
        this.login(this.tokens.token);
        this.bannedWords.initLoad();
        this.userLevels.initLoad().intervalSave(15000).disableSaveNotifs();
        this.dmForwardBlacklist.initLoad();
        this.punishments.initLoad();
        this.FMstaff.initLoad();
        this.TFstaff.initLoad();
        this.watchList.initLoad();
        this.votes.initLoad();
        this.repeatedMessagesContent.initLoad();
        const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
        for (const file of commandFiles) {
	        const command = require(`./commands/${file}`);
	        this.commands.set(command.data.name, command);
	        this.registery.push(command.data.toJSON())
           }
           this.commands.get("ping").spammers = new this.collection();
    }
    formatPunishmentType(punishment, client, cancels) {
        if (punishment.type === 'removeOtherPunishment') {
            cancels ||= this.punishments._content.find(x => x.id === punishment.cancels)
            return cancels.type[0].toUpperCase() + cancels.type.slice(1) + ' Removed';
        } else return punishment.type[0].toUpperCase() + punishment.type.slice(1);
    }
    formatTime(integer, accuracy = 1, options = {}) {
        const timeNames = require('./timeNames.js');
        let achievedAccuracy = 0;
        let text = '';
        const { longNames, commas } = options;
        for (const timeName of timeNames) {
            if (achievedAccuracy < accuracy) {
                const fullTimelengths = Math.floor(integer / timeName.length);
                if (fullTimelengths === 0) continue;
                achievedAccuracy++;
                text += fullTimelengths + (longNames ? (' ' + timeName.name + (fullTimelengths === 1 ? '' : 's')) : timeName.name.slice(0, timeName.name === 'month' ? 2 : 1)) + (commas ? ', ' : ' ');
                integer -= fullTimelengths * timeName.length;
            } else {
                break;
            }
        }
        if (text.length === 0) text = integer + (longNames ? ' milliseconds' : 'ms') + (commas ? ', ' : '');
        if (commas) {
            text = text.slice(0, -2);
            if (longNames) {
                text = text.split('');
                text[text.lastIndexOf(',')] = ' and';
                text = text.join('');
            }
        }
        return text.trim();
    };
    hasModPerms(client, guildMember) {
        return this.config.mainServer.staffRoles.map(x => this.config.mainServer.roles[x]).some(x => guildMember.roles.cache.has(x));
    };
    isMPStaff(client, guildMember) {
        return this.config.mainServer.MPStaffRoles.map(x => this.config.mainServer.roles[x]).some(x => guildMember.roles.cache.has(x));
    };

    async FSstats(client, interaction, serverName, DBName) {
        const axios = require("axios");
		const embed = new client.embed()
        const playerInfo = [];
        let FSserver;
        const data = require(`../databases/${DBName}.json`).slice(-24)

        // handle negative days
        data.forEach((change, i) => {
            if (change < 0) data[i] = data[i - 1] || data[i + 1] || 0;
        });

        const maxValue = Math.max(...data);
        const maxValueArr = maxValue.toString().split('');
        
        const first_graph_top = 16;
        console.log({ first_graph_top });
        
        const second_graph_top = 16;
        console.log({ second_graph_top });

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
        console.log({ interval_candidates });
        const chosen_interval = interval_candidates.sort((a, b) => b[2] - a[2])[0];
        console.log({ chosen_interval });

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
        const lastMonthStart = graphOrigin[0] + (nodeWidth * (data.length - 12));
        ctx.lineTo(lastMonthStart, graphOrigin[1]);
        ctx.lineTo(lastMonthStart, graphOrigin[1] + graphSize[1]);
        ctx.stroke();
        ctx.closePath();
        ctx.setLineDash([]);

        // draw points
        ctx.strokeStyle = '#06860a';
        ctx.fillStyle = '#06860a';
        ctx.lineWidth = 7;


        function getYCoordinate(value) {
            return ((1 - (value / second_graph_top)) * graphSize[1]) + graphOrigin[1];
        }
        let lastCoords = [];
        data.forEach((val, i) => {
            ctx.beginPath();
            if (lastCoords.length > 0) ctx.moveTo(...lastCoords);
            if (val < 0) val = 0;
            const x = i * nodeWidth + graphOrigin[0];
            const y = getYCoordinate(val);
            ctx.lineTo(x, y);
            lastCoords = [x, y];
            ctx.stroke();
            ctx.closePath();
        
            // ball
            ctx.beginPath();
            ctx.arc(x, y, ctx.lineWidth * 1.2, 0, 2 * Math.PI)
            ctx.closePath();
            ctx.fill();
        
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
        ctx.fillText('12h ago', lastMonthStart, graphOrigin[1] - (textSize / 3));
        
        // time ->
        const tx = graphOrigin[0] + (textSize / 2);
        const ty = graphOrigin[1] + graphSize[1] + (textSize);
        ctx.fillText('time -> min', tx, ty);

        try {
            FSserver = await axios.get(serverName, {timeout: 2000});
        } catch (err) {
            return interaction.reply('Server did not respond');
        }
        await FSserver.data.slots.players.forEach(player => {
        if (player.name === undefined) return;
        playerInfo.push(`\`${player.name}\` ${(player.isAdmin ? ' :detective:' : '')}${(client.FMstaff._content.includes(player.name) ? ':farmer:' : '')}${(client.TFstaff._content.includes(player.name) ? ':angel:' : '')} **|** ${('0' + Math.floor(player.uptime/60)).slice(-2)}:${('0' + (player.uptime % 60)).slice(-2)}`);
        })
        const Image = new Discord.MessageAttachment(img.toBuffer(), "FSStats.png")
        embed.setAuthor({name: `${FSserver.data.slots.used}/${FSserver.data.slots.capacity}`})
        embed.setTitle(FSserver.data.server.name)
        embed.setImage('attachment://FSStats.png')
		if (FSserver.data.slots.used === FSserver.data.slots.capacity) {
			embed.setColor(client.config.embedColorRed)
		} else if (FSserver.data.slots.used > 9) {
			embed.setColor(client.config.embedColorYellow)
		} else embed.setColor(client.config.embedColorGreen)
        embed.setDescription(`${FSserver.data.slots.used === 0 ? 'No players online' : playerInfo.join("\n")}`);
        embed.setFooter({text: `In-game time: ${('0' + Math.floor((FSserver.data.server.dayTime/3600/1000))).slice(-2)}:${('0' + Math.floor((FSserver.data.server.dayTime/60/1000)%60)).slice(-2)} | Version: ${FSserver.data.server.version} | Map: ${FSserver.data.server.mapName}`});
		interaction.reply({embeds: [embed], files: [Image]})
    }

    async FSstatsLoop(client, serverName, Channel, Message) {
        const axios = require("axios");
	    const BLACKLIST = ["Bernie", "RedbaD", "SpongeBoi69", "Kazmerev"]
		const embed = new client.embed()
        const playerInfo = [];
        let FSserver;
        try {
            FSserver = await axios.get(serverName, {timeout: 2000});
        } catch (err) {
            embed.setTitle('Server not responding');
            embed.setColor(client.config.embedColorRed);
            client.channels.resolve(Channel).messages.fetch(Message).then((msg)=>{ msg.edit({embeds: [embed]})});
            return;
        }
        await FSserver.data.slots.players.forEach(player => {
        if (player.name === undefined) return;
        playerInfo.push(`\`${player.name}\` ${(player.isAdmin ? ' :detective:' : '')}${(client.FMstaff._content.includes(player.name) ? ':farmer:' : '')}${(client.TFstaff._content.includes(player.name) ? ':angel:' : '')} **|** ${('0' + Math.floor(player.uptime/60)).slice(-2)}:${('0' + (player.uptime % 60)).slice(-2)}`);
		if (player.isAdmin && (!BLACKLIST.includes(player.name) && !client.FMstaff._content.includes(player.name))) {
			client.channels.resolve(client.config.mainServer.channels.fslogs).send(`\`${player.name}\` | \`${FSserver.data.server.name}\` | <t:${Math.round(new Date() / 1000)}>`)
		}
        })
        embed.setAuthor({name: `${FSserver.data.slots.used}/${FSserver.data.slots.capacity}`})
        embed.setTitle(FSserver.data.server.name)
		if (FSserver.data.slots.used === FSserver.data.slots.capacity) {
			embed.setColor(client.config.embedColorRed)
		} else if (FSserver.data.slots.used > 9) {
			embed.setColor(client.config.embedColorYellow)
		} else embed.setColor(client.config.embedColorGreen)
        embed.setDescription(`${FSserver.data.slots.used === 0 ? 'No players online' : playerInfo.join("\n")}`);
        embed.setFooter({text: `In-game time: ${('0' + Math.floor((FSserver.data.server.dayTime/3600/1000))).slice(-2)}:${('0' + Math.floor((FSserver.data.server.dayTime/60/1000)%60)).slice(-2)} | Version: ${FSserver.data.server.version} | Map: ${FSserver.data.server.mapName}`});
		client.channels.resolve(Channel).messages.fetch(Message).then((msg)=>{ msg.edit({embeds: [embed]})})
    }

    async FSJoinLeaveLog (client, serverName) {
        const axios = require("axios");
        const PGdata = require('./databases/PGPlayerData.json')
        const PSdata = require('./databases/PSPlayerData.json')
        const MFdata = require('./databases/MFPlayerData.json')
        const oldData = []; // Array for player names of first fetch
        const newData = []; // Array for player names of second fetch
        let oldServerData;
        let newServerData;

        try {
            oldServerData = await axios.get(serverName, {timeout: 5000}); // Fetch dedicated-server-stats.json
        } catch (err) {
            return console.log(err); // Blame Red
        }
        if (oldServerData.data.server.name.includes('Silage')) {
            PSdata.push(oldServerData.data.slots.used);
            fs.writeFileSync(__dirname + "/databases/PSPlayerData.json", JSON.stringify(PSdata));
            console.log(`Pushed ${oldServerData.data.slots.used} to PS`)
        } else if (oldServerData.data.server.name.includes('Grain')) {
            PGdata.push(oldServerData.data.slots.used);
            fs.writeFileSync(__dirname + "/databases/PGPlayerData.json", JSON.stringify(PGdata));
            console.log(`Pushed ${oldServerData.data.slots.used} to PG`)
        } else if (oldServerData.data.server.name.includes('Multi')) {
            MFdata.push(oldServerData.data.slots.used);
            fs.writeFileSync(__dirname + "/databases/MFPlayerData.json", JSON.stringify(MFdata));
            console.log(`Pushed ${oldServerData.data.slots.used} to MF`)
        }
        await oldServerData.data.slots.players.forEach(player => {
            if (player.name === undefined) return;
            oldData.push(player.name); // Add player name to first array
            })

        setTimeout( async () => { // Fetch second time 5 seconds before it loops

            try {
                newServerData = await axios.get(serverName, {timeout: 5000}); // Fetch dedicated-server-stats.json
            } catch (err) {
                return console.log(err); // Blame Red
            }
            await newServerData.data.slots.players.forEach(player => {
                if (player.name === undefined) return;
                newData.push(player.name); // Add player name to second array
                })

            const missingElementsLeave = oldData.filter(element => !newData.includes(element)); // Filter names that were in the first fetch but not the second. Thanks to LebSter#0617 for this on The Coding Den Discord server
            for (const missingElement of missingElementsLeave) {
                if (client.watchList._content.includes(missingElement)) {
                    client.channels.resolve(client.config.mainServer.channels.watchlist).send({embeds: [new client.embed().setTitle('WATCHLIST').setDescription(`\`${missingElement}\` left __${newServerData.data.server.name}__ at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorGreen)]})
                } // Hopefully that person got banned
            // missingElement was present in arr1 but not in arr2
            client.channels.resolve(client.config.mainServer.channels.fslogs).send({embeds: [new client.embed().setDescription(`\`${missingElement}\` left __${newServerData.data.server.name}__ at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorRed)]})
            } // Player left the server, hurry up and join
	    
	    const missingElementsJoin = newData.filter(element => !oldData.includes(element)); // Filter names that were in the second fetch but not the first. Thanks to LebSter#0617 for this on The Coding Den Discord server
            for (const missingElement of missingElementsJoin) {
                if (client.watchList._content.includes(missingElement)) {
                    client.channels.resolve(client.config.mainServer.channels.watchlist).send({embeds: [new client.embed().setTitle('WATCHLIST').setDescription(`\`${missingElement}\` joined __${newServerData.data.server.name}__ at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorRed)]})
                } // Oh no, go get em Toast
            // missingElement was present in arr2 but not in arr1
            client.channels.resolve(client.config.mainServer.channels.fslogs).send({embeds: [new client.embed().setDescription(`\`${missingElement}\` joined __${newServerData.data.server.name}__ at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorGreen)]})
            } // Player joined the server, they beat you to it
            
        }, 55000); 
    }
    removeCustomValue(array, value){
        for(let i = 0; i < array.length; i++){
            if(array[i].includes(value)){
                array.splice(i, 1)
                break;
            }
        }
        return array;
    };
    makeModlogEntry(data, client) {
        const cancels = data.cancels ? client.punishments._content.find(x => x.id === data.cancels) : null;
    
        // format data into embed
        const embed = new this.embed()
            .setTitle(`${this.formatPunishmentType(data, client, cancels)} | Case #${data.id}`)
            .addFields(
            {name: '🔹 User', value: `<@${data.member}> \`${data.member}\``, inline: true},
            {name: '🔹 Moderator', value: `<@${data.moderator}> \`${data.moderator}\``, inline: true},
            {name: '\u200b', value: '\u200b', inline: true},
            {name: '🔹 Reason', value: `\`${data.reason || 'unspecified'}\``, inline: true})
            .setColor(this.config.embedColor)
            .setTimestamp(data.time)
        if (data.duration) {
            embed.addFields(
            {name: '🔹 Duration', value: client.formatTime(data.duration, 100), inline: true},
            {name: '\u200b', value: '\u200b', inline: true}
            )
        }
        if (data.cancels) embed.addFields({name: '🔹 Overwrites', value: `This case overwrites Case #${cancels.id} \`${cancels.reason}\``});
    
        // send embed in modlog channel
        client.channels.cache.get(client.config.mainServer.channels.staffreports).send({embeds: [embed]});
    };
    async punish(client, interaction, type) {
        if (!client.hasModPerms(client, interaction.member)) return interaction.reply({content: `You need the <@&${client.config.mainServer.roles.mod}> role to use this command.`, allowedMentions: {roles: false}});
        if (type !== ('warn' || 'mute') && interaction.member.roles.cache.has(client.config.mainServer.roles.helper)) return interaction.reply({content: `You need the <@&${client.config.mainServer.roles.mod}> role to use this command.`, allowedMentions: {roles: false}});
        const member = interaction.options.getMember("member");
        const time = interaction.options.getString("time");
        const reason = interaction.options.getString("reason") ?? "None";
	if (interaction.user.id === member.id) return interaction.reply(`You cannot ${type} yourself.`)
	if (client.hasModPerms(client, member)) return interaction.reply(`You cannot ${type} another staff member.`)
        const result = await client.punishments.addPunishment(type, member, { time, reason, interaction }, interaction.user.id);
        if(typeof result !== String){
            interaction.reply({embeds: [result]});
        } else {
            interaction.reply({content: `${result}`})
        }
    };
    async unPunish(client, interaction) {
        if (!client.hasModPerms(client, interaction.member)) return interaction.reply({content: `You need the <@&${client.config.mainServer.roles.mod}> role to use this command.`, ephemeral: true, allowedMentions: {roles: false}});
        const punishment = client.punishments._content.find(x => x.id === `${interaction.options.getInteger("case_id")}`);
        if (!punishment) return interaction.reply({content: "that isn't a valid case ID.", ephemeral: true});
        if (punishment.type !== 'warn' && interaction.member.roles.cache.has(client.config.mainServer.roles.helper)) return interaction.reply({content: 'Helpers can only remove warnings.', ephemeral: true, allowedMentions: {roles: false}});
        const reason = interaction.options.getString("reason") ?? "None";
        const unpunishResult = await client.punishments.removePunishment(punishment.id, interaction.user.id, reason);
        interaction.reply(unpunishResult);
    };
}

module.exports = YClient;
