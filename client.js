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
        this.games = new Discord.Collection();
        this.commands = new Discord.Collection();
        this.registery = [];
        this.setMaxListeners(100)
        this.FSCache;
        this.FSCacheOldPS = [];
        this.FSCacheOldPG = [];
        this.FSCacheOldMF = [];
        this.FSCacheNewPS = [];
        this.FSCacheNewPG = [];
        this.FSCacheNewMF = [];
        this.bannedWords = new database("./databases/bannedWords.json", "array");
        this.tictactoeDb = new database("./databases/ttt.json", "array");
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
        this.tictactoeDb.initLoad().intervalSave();
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
    yOuNeEdMoD(client, interaction) {
        return interaction.reply({content: `You need the <@&${client.config.mainServer.roles.mod}> role to use this command`, allowedMentions: {roles: false}});
    }

    async FSstatsLoop(client, serverName, Channel, Message) {
        const axios = require("axios");
		const embed = new client.embed()
        const playerInfo = [];
        let FSserver;
        try {
            FSserver = await axios.get(serverName, {timeout: 5000});
        } catch (err) {
            embed.setTitle('Server not responding');
            embed.setColor(client.config.embedColorRed);
            client.channels.resolve(Channel).messages.fetch(Message).then((msg)=>{ msg.edit({embeds: [embed]})});
            console.log(`stats loop fail; ${serverName}`)
            return;
        }
        await FSserver.data.slots.players.forEach(player => {
        if (player.name === undefined) return;
        playerInfo.push(`\`${player.name}\` ${(player.isAdmin ? ' :detective:' : '')}${(client.FMstaff._content.includes(player.name) ? ':farmer:' : '')}${(client.TFstaff._content.includes(player.name) ? ':angel:' : '')} **|** ${('0' + Math.floor(player.uptime/60)).slice(-2)}:${('0' + (player.uptime % 60)).slice(-2)}`);
        })
        embed.setAuthor({name: `${FSserver.data.slots.used}/${FSserver.data.slots.capacity}`})
		if (FSserver.data.slots.used === FSserver.data.slots.capacity) {
			embed.setColor(client.config.embedColorRed)
		} else if (FSserver.data.slots.used > 9) {
			embed.setColor(client.config.embedColorYellow)
		} else embed.setColor(client.config.embedColorGreen)
        embed.setDescription(`${FSserver.data.slots.used === 0 ? 'No players online' : playerInfo.join("\n")}`);
        embed.setFooter({text: `In-game time: ${('0' + Math.floor((FSserver.data.server.dayTime/3600/1000))).slice(-2)}:${('0' + Math.floor((FSserver.data.server.dayTime/60/1000)%60)).slice(-2)} | Version: ${FSserver.data.server.version} | Map: ${FSserver.data.server.mapName}`});
		client.channels.resolve(Channel).messages.fetch(Message).then((msg)=>{ msg.edit({embeds: [embed]})})
    }

    async FSLeaveJoinLog (client, serverName) {
        const axios = require("axios");
        const PGdata = require('./databases/PGPlayerData.json')
        const PSdata = require('./databases/PSPlayerData.json')
        const MFdata = require('./databases/MFPlayerData.json')
        const BLACKLIST = ["Bernie", "RedbaD", "SpongeBoi69", "Kazmerev", "Hungarian__0101"]
        let FSserver;
    
        try {
            FSserver = await axios.get(serverName, {timeout: 5000}); // Fetch dedicated-server-stats.json
        } catch (err) {
            return console.log(`stats leaveJoin failed; ${serverName}`); // Blame Red
        }
    
        await FSserver.data.slots.players.forEach(player => {
            if (player.isAdmin && (!BLACKLIST.includes(player.name) && !client.FMstaff._content.includes(player.name))) {
                // If user isn't staff or exempt from being logged in as admin, log them, the server name, and the time because that's sus
                client.channels.resolve(client.config.mainServer.channels.fslogs).send({embeds: [new client.embed().setTitle('ADMIN LOGIN').setDescription(`\`${player.name}\` login into **${FSserver.data.server.name.replace('! IRTGaming|24/7 ', '')}** at <t:${Math.round(new Date() / 1000)}>`).setColor('#ff4d00')]})
            }
            })

        if (FSserver.data.server.name.includes('Silage')) {
            PSdata.push(FSserver.data.slots.used);  
            fs.writeFileSync(__dirname + "/databases/PSPlayerData.json", JSON.stringify(PSdata));
            // console.log(`\nPushed ${FSserver.data.slots.used} to PS`)

            client.FSCacheNewPS = [];
            await FSserver.data.slots.players.forEach(player => {
                if (player.name === undefined) return;
                client.FSCacheNewPS.push(player.name); // Add player name to first array
            })

            // console.log(`PS NEW ${client.FSCacheNewPS}`)
            const missingElementsLeave = client.FSCacheOldPS.filter(element => !client.FSCacheNewPS.includes(element)); // Filter names that were in the first fetch but not the second. Thanks to LebSter#0617 for this on The Coding Den Discord server
            for (const missingElement of missingElementsLeave) {
                if (client.watchList._content.includes(missingElement)) {
                    client.channels.resolve(client.config.mainServer.channels.watchlist).send({embeds: [new client.embed().setTitle('WATCHLIST').setDescription(`\`${missingElement}\` left **PS** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorGreen)]})
                } // Hopefully that person got banned
            // missingElement was present in arr1 but not in arr2
            client.channels.resolve(client.config.mainServer.channels.fslogs).send({embeds: [new client.embed().setDescription(`\`${missingElement}\` ${(client.FMstaff._content.includes(missingElement) ? ':farmer:' : '')}${(client.TFstaff._content.includes(missingElement) ? ':angel:' : '')} left **PS** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorRed)]})
            } // Player left the server, hurry up and join
            
            const missingElementsJoin = client.FSCacheNewPS.filter(element => !client.FSCacheOldPS.includes(element)); // Filter names that were in the second fetch but not the first. Thanks to LebSter#0617 for this on The Coding Den Discord server
            for (const missingElement of missingElementsJoin) {
                if (client.watchList._content.includes(missingElement)) {
                    client.channels.resolve(client.config.mainServer.channels.watchlist).send({embeds: [new client.embed().setTitle('WATCHLIST').setDescription(`\`${missingElement}\` joined **PS** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorRed)]})
                } // Oh no, go get em Toast
            // missingElement was present in arr2 but not in arr1
            if (client.FSCacheOldPS.length !== 0) {
                client.channels.resolve(client.config.mainServer.channels.fslogs).send({embeds: [new client.embed().setDescription(`\`${missingElement}\` ${(client.FMstaff._content.includes(missingElement) ? ':farmer:' : '')}${(client.TFstaff._content.includes(missingElement) ? ':angel:' : '')} joined **PS** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorGreen)]})}
            } // Player joined the server, they beat you to it
            // console.log(`PS OLD ${client.FSCacheOldPS}`)
        
            client.FSCacheOldPS = [];
            await FSserver.data.slots.players.forEach(player => {
                if (player.name === undefined) return;
                client.FSCacheOldPS.push(player.name); // Add player name to first array
            })

        } else if (FSserver.data.server.name.includes('Grain')) {
            PGdata.push(FSserver.data.slots.used);
            fs.writeFileSync(__dirname + "/databases/PGPlayerData.json", JSON.stringify(PGdata));
            // console.log(`\nPushed ${FSserver.data.slots.used} to PG`)

            client.FSCacheNewPG = [];
            await FSserver.data.slots.players.forEach(player => {
                if (player.name === undefined) return;
                client.FSCacheNewPG.push(player.name); // Add player name to first array
            })

            // console.log(`PG NEW ${client.FSCacheNewPG}`)
            const missingElementsLeave = client.FSCacheOldPG.filter(element => !client.FSCacheNewPG.includes(element)); // Filter names that were in the first fetch but not the second. Thanks to LebSter#0617 for this on The Coding Den Discord server
            for (const missingElement of missingElementsLeave) {
                if (client.watchList._content.includes(missingElement)) {
                    client.channels.resolve(client.config.mainServer.channels.watchlist).send({embeds: [new client.embed().setTitle('WATCHLIST').setDescription(`\`${missingElement}\` left **PG** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorGreen)]})
                } // Hopefully that person got banned
            // missingElement was present in arr1 but not in arr2
            client.channels.resolve(client.config.mainServer.channels.fslogs).send({embeds: [new client.embed().setDescription(`\`${missingElement}\` ${(client.FMstaff._content.includes(missingElement) ? ':farmer:' : '')}${(client.TFstaff._content.includes(missingElement) ? ':angel:' : '')} left **PG** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorRed)]})
            } // Player left the server, hurry up and join
            
            const missingElementsJoin = client.FSCacheNewPG.filter(element => !client.FSCacheOldPG.includes(element)); // Filter names that were in the second fetch but not the first. Thanks to LebSter#0617 for this on The Coding Den Discord server
            for (const missingElement of missingElementsJoin) {
                if (client.watchList._content.includes(missingElement)) {
                    client.channels.resolve(client.config.mainServer.channels.watchlist).send({embeds: [new client.embed().setTitle('WATCHLIST').setDescription(`\`${missingElement}\` joined **PG** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorRed)]})
                } // Oh no, go get em Toast
            // missingElement was present in arr2 but not in arr1
            if (client.FSCacheOldPG.length !== 0) {
            client.channels.resolve(client.config.mainServer.channels.fslogs).send({embeds: [new client.embed().setDescription(`\`${missingElement}\` ${(client.FMstaff._content.includes(missingElement) ? ':farmer:' : '')}${(client.TFstaff._content.includes(missingElement) ? ':angel:' : '')} joined **PG** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorGreen)]})
            }
            } // Player joined the server, they beat you to it
            // console.log(`PG OLD ${client.FSCacheOldPG}`)
        
            client.FSCacheOldPG = [];
            await FSserver.data.slots.players.forEach(player => {
                if (player.name === undefined) return;
                client.FSCacheOldPG.push(player.name); // Add player name to first array
            })

        } else if (FSserver.data.server.name.includes('Multi')) {
            MFdata.push(FSserver.data.slots.used);
            fs.writeFileSync(__dirname + "/databases/MFPlayerData.json", JSON.stringify(MFdata));
            // console.log(`\nPushed ${FSserver.data.slots.used} to MF`)

            client.FSCacheNewMF = [];
            await FSserver.data.slots.players.forEach(player => {
                if (player.name === undefined) return;
                client.FSCacheNewMF.push(player.name); // Add player name to first array
            })

            // console.log(`MF NEW ${client.FSCacheNewMF}`)
            const missingElementsLeave = client.FSCacheOldMF.filter(element => !client.FSCacheNewMF.includes(element)); // Filter names that were in the first fetch but not the second. Thanks to LebSter#0617 for this on The Coding Den Discord server
            for (const missingElement of missingElementsLeave) {
            // missingElement was present in arr1 but not in arr2
            client.channels.resolve(client.config.mainServer.channels.fslogs).send({embeds: [new client.embed().setDescription(`\`${missingElement}\` ${(client.FMstaff._content.includes(missingElement) ? ':farmer:' : '')}${(client.TFstaff._content.includes(missingElement) ? ':angel:' : '')} left **MF** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorRed)]})
            } // Player left the server, hurry up and join
            
            const missingElementsJoin = client.FSCacheNewMF.filter(element => !client.FSCacheOldMF.includes(element)); // Filter names that were in the second fetch but not the first. Thanks to LebSter#0617 for this on The Coding Den Discord server
            for (const missingElement of missingElementsJoin) {
            // missingElement was present in arr2 but not in arr1
            if (client.FSCacheOldMF.length !== 0) {
            client.channels.resolve(client.config.mainServer.channels.fslogs).send({embeds: [new client.embed().setDescription(`\`${missingElement}\` ${(client.FMstaff._content.includes(missingElement) ? ':farmer:' : '')}${(client.TFstaff._content.includes(missingElement) ? ':angel:' : '')} joined **MF** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorGreen)]})
            }
            } // Player joined the server, they beat you to it
            // console.log(`MF OLD ${client.FSCacheOldMF}`)
        
            client.FSCacheOldMF = [];
            await FSserver.data.slots.players.forEach(player => {
                if (player.name === undefined) return;
                client.FSCacheOldMF.push(player.name); // Add player name to first array
            })
        }
    }

    alignText(text, length, alignment, emptyChar = ' ') {
        if (alignment === 'right') {
            text = emptyChar.repeat(length - text.length) + text;
        } else if (alignment === 'middle') {
            const emptyCharsPerSide = (length - text.length) / 2;
            text = emptyChar.repeat(Math.floor(emptyCharsPerSide)) + text + emptyChar.repeat(Math.floor(emptyCharsPerSide));
        } else {
            text = text + emptyChar.repeat(length - text.length);
        }
        return text;
    }
    createTable(columnTitles = [], rowsData = [], options = {}, client) {
        const rows = [];
        // { columnAlign: [], columnSeparator: [], columnEmptyChar: [] }
        let { columnAlign = [], columnSeparator = [], columnEmptyChar = [] } = options;
        if (columnSeparator.length < 1) columnSeparator.push('|');
        columnSeparator = columnSeparator.map(x => ' ' + x + ' ');
        // column widths
        const columnWidths = columnTitles.map((title, i) => Math.max(title.length, ...rowsData.map(x => x[i].length)));
        // first row
        rows.push(columnTitles.map((title, i) => {
            let text = client.alignText(title, columnWidths[i], columnAlign[i], columnEmptyChar[i]);
            if (columnSeparator[i]) {
                text += ' '.repeat(columnSeparator[i].length);
            }
            return text;
        }).join(''));
        // big line
        rows.push('???'.repeat(rows[0].length));
        // data
        // remove unicode
        rowsData.map(row => {
            return row.map(element => {
                return element.split('').map(char => {
                    if (char.charCodeAt(0) > 128) return '???';
                }).join('');
            });
        });
        rows.push(rowsData.map(row => row.map((element, i) => {
                return client.alignText(element, columnWidths[i], columnAlign[i], columnEmptyChar[i]) + (i === columnTitles.length - 1 ? '' : columnSeparator[i]);
            }).join('')
        ).join('\n'))
    
        return rows.join('\n');
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
            {name: '???? User', value: `<@${data.member}> \`${data.member}\``, inline: true},
            {name: '???? Moderator', value: `<@${data.moderator}> \`${data.moderator}\``, inline: true},
            {name: '\u200b', value: '\u200b', inline: true},
            {name: '???? Reason', value: `\`${data.reason || 'unspecified'}\``, inline: true})
            .setColor(this.config.embedColor)
            .setTimestamp(data.time)
        if (data.duration) {
            embed.addFields(
            {name: '???? Duration', value: client.formatTime(data.duration, 100), inline: true},
            {name: '\u200b', value: '\u200b', inline: true}
            )
        }
        if (data.cancels) embed.addFields({name: '???? Overwrites', value: `This case overwrites Case #${cancels.id} \`${cancels.reason}\``});
    
        // send embed in modlog channel
        client.channels.cache.get(client.config.mainServer.channels.staffreports).send({embeds: [embed]});
    };
    async punish(client, interaction, type) {
        if (!client.hasModPerms(client, interaction.member)) return client.yOuNeEdMoD(client, interaction);
        if (type !== ('warn' || 'mute') && interaction.member.roles.cache.has(client.config.mainServer.roles.helper)) return client.yOuNeEdMoD(client, interaction);
        const member = interaction.options.getMember("member");
        const time = interaction.options.getString("time");
        const reason = interaction.options.getString("reason") ?? "None";
	if (interaction.user.id === member.id) return interaction.reply(`You cannot ${type} yourself.`)
	if (client.hasModPerms(client, member)) return interaction.reply(`You cannot ${type} another staff member.`)
        const result = await client.punishments.addPunishment(type, member, { time, reason, interaction }, interaction.user.id);
        (typeof result === String ? interaction.reply({content: `${result}`}) : interaction.reply({embeds: [result]}))
    };
    async unPunish(client, interaction) {
        if (!client.hasModPerms(client, interaction.member)) return client.yOuNeEdMoD(client, interaction);
        const punishment = client.punishments._content.find(x => x.id === interaction.options.getInteger("case_id"));
        if (!punishment) return interaction.reply({content: "that isn't a valid case ID.", ephemeral: true});
        if (punishment.type !== ('warn' || 'mute') && interaction.member.roles.cache.has(client.config.mainServer.roles.helper)) return client.yOuNeEdMoD(client, interaction);
        const reason = interaction.options.getString("reason") ?? "None";
        const unpunishResult = await client.punishments.removePunishment(punishment.id, interaction.user.id, reason);
        interaction.reply(unpunishResult);
    };
}

module.exports = YClient;
