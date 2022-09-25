const { Client, GatewayIntentBits, Partials } = require("discord.js");
const Discord = require("discord.js");
const fs = require("node:fs");
const moment = require('moment');
const database = require("./database");
class YClient extends Client {
    constructor(options){
        super({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildBans, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates],
            partials: [Partials.Channel, Partials.Message, Partials.Reaction],
            disableEveryone: true,
            ws: {properties: {browser: "Discord iOS"}}
        })
        this.invites = new Map();
        this.config = require("./config.json");
        this.tokens = require("./tokens.json");
        this.embed = Discord.EmbedBuilder;
        this.collection = Discord.Collection;
        this.messageCollector = Discord.MessageCollector;
        this.attachmentbuilder = Discord.AttachmentBuilder;
        this.memberCount_LastGuildFetchTimestamp = 0;
        this.games = new Discord.Collection();
        this.commands = new Discord.Collection();
        this.registery = [];
        this.setMaxListeners(100)
        this.voted;
        this.FSCache = {'statsGraph': -120, 'ps': {'new': [], 'old': [], 'status': undefined}, 'pg': {'new': [], 'old': [], 'status': undefined}, 'mf': {'new': [], 'old': [], 'status': undefined}};
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

    async FSLoop(client, serverURLdss, serverURLcsg, Channel, Message, serverAcro) {

        function dataPoint(Acro, slotUsage) {
            const DB = require(`./databases/${Acro}PlayerData.json`);
            DB.push(slotUsage);
            fs.writeFileSync(__dirname + `/databases/${Acro}PlayerData.json`, JSON.stringify(DB));
        }
        function adminCheck(client, ArrayNew, ArrayOld, Acro, Whitelist) {
            ArrayNew.filter(x => {
                !ArrayOld.some((y)=> {
                    if (y.name === x.name && !y.isAdmin && x.isAdmin) {
                        if (!Whitelist.includes(x.name) && !client.FMstaff._content.includes(x.name)) {
                            client.channels.resolve('830916009107652630').send({embeds: [new client.embed().setTitle('UNKNOWN ADMIN LOGIN').setDescription(`\`${x.name}\` on **${Acro}** at <t:${Math.round(new Date() / 1000)}>`).setColor('#ff4d00')]})
                        }
                    }
                })
            });
        }
        function log(client, ArrayNew, ArrayOld, Acro, watchList = true) {
            // Filter for players leaving
            const missingElementsLeave = ArrayOld.filter(x => !ArrayNew.some(y => y.name === x.name)); // Filter names that were in the first fetch but not the second. Thanks to LebSter#0617 for this on The Coding Den Discord server
            console.log(missingElementsLeave)
            for (const x of missingElementsLeave) {
                if (watchList) {
                    client.watchList._content.forEach(y => {
                        if (y[0] === x.name) {
                            wlChannel.send({embeds: [new client.embed().setTitle('WATCHLIST').setDescription(`\`${y[0]}\` left **${Acro}** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorRed)]})
                        } // Hopefully that person got banned
                    })
                }
                logChannel.send({embeds: [new client.embed().setDescription(`\`${x.name}\` ${(!x.isAdmin ? '' : ':detective:')}${(client.FMstaff._content.includes(x.name) ? ':farmer:' : '')}${(client.TFstaff._content.includes(x.name) ? ':angel:' : '')} left **${Acro}** at <t:${Math.round(new Date() / 1000)}:t>`).setFooter({text: `Playtime: ${(Math.floor(x.uptime/60))}:${('0' + (x.uptime % 60)).slice(-2)}`}).setColor(client.config.embedColorRed)]})
            }
                        
            // Filter for players joining
            let playerObj;
            if (ArrayOld.length == 0 && client.uptime > 31000) {
                playerObj = ArrayNew;
            } else if (ArrayOld.length != 0) {
                playerObj = ArrayNew.filter(y => !ArrayOld.some(z => z.name === y.name));
            }

            if (playerObj != undefined) {
                playerObj.forEach(x => {
                    if (watchList) {
                        client.watchList._content.forEach(y => {
                            if (y[0] === x.name) {
                                wlChannel.send({content: `${wlPing.map(x=>`<@${x}>`).join(" ")}`, embeds: [new client.embed().setTitle('WATCHLIST').setDescription(`\`${y[0]}\` joined **${Acro}** at <t:${Math.round(new Date() / 1000)}:t>`).setFooter({text: `Reason: ${y[1]}`}).setColor(client.config.embedColorGreen)]})
                            } // Oh no, go get em Toast
                        })
                    }
                    logChannel.send({embeds: [new client.embed().setDescription(`\`${x.name}\` ${(client.FMstaff._content.includes(x.name) ? ':farmer:' : '')}${(client.TFstaff._content.includes(x.name) ? ':angel:' : '')} joined **${Acro}** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorGreen)]})
                })
            }
        }

        const axios = require("axios");
        const xjs = require('xml-js');
        const Whitelist = ["SpongeBoi69", "Kazmerev", "Hungarian__0101", "Sersha", "Helper B", "777Stupid", "Andyk1978", "Andrewk1978", "OmgxBeckyx"]
        const wlPing = ["263724396672188417", "769710040596217897", "642735886953611265"];
        const wlChannel = client.channels.resolve(client.config.mainServer.channels.watchlist);
        const logChannel = client.channels.resolve(client.config.mainServer.channels.fslogs)
        const playerInfo = [];
        const embed = new client.embed();
        let error;
        let FSdss;
        let FScsg = undefined;
        let xml;
    
        try { // Fetch dedicated-server-stats.json
            FSdss = await axios.get(serverURLdss, {timeout: 5000});
        } catch (err) {
            error = true
            console.log(`[${moment().format('HH:mm:ss')}] ${serverAcro} dss fail`)
        }

        try { // Fetch dedicated-server-savegame.xml
            xml = await axios.get(serverURLcsg, {timeout: 5000});
        } catch (err) {
            error = true;
            console.log(`[${moment().format('HH:mm:ss')}] ${serverAcro} csg fail`)
        }

        if (error) { // Blame Red
            embed.setTitle('Host not responding');
            embed.setColor(client.config.embedColorRed);
            client.channels.resolve(Channel).messages.fetch(Message).then((msg)=>{ msg.edit({embeds: [embed]})});
            return;
        }

        FScsg = await xjs.xml2js(xml.data, {compact: true, spaces: 2}).careerSavegame; // Convert dedicated-server-savegame.xml
    
        await FSdss.data.slots.players.filter((x)=> x.isUsed !== false).forEach(player => {
            let wlPlayer = ''; // Tag for if player is on watchList
            client.watchList._content.forEach((x) => {
                if (x[0] === player.name) {
                    wlPlayer = '⛔';
                }
            })
            playerInfo.push(`\`${player.name}\` ${wlPlayer}${(player.isAdmin ? ' :detective:' : '')}${(client.FMstaff._content.includes(player.name) ? ':farmer:' : '')}${(client.TFstaff._content.includes(player.name) ? ':angel:' : '')} **|** ${(Math.floor(player.uptime/60))}:${('0' + (player.uptime % 60)).slice(-2)}`);
        })

        // Stats embed
        embed.setAuthor({name: `${FSdss.data.slots.used}/${FSdss.data.slots.capacity}`})
		if (FSdss.data.slots.used === FSdss.data.slots.capacity) {
			embed.setColor(client.config.embedColorRed)
		} else if (FSdss.data.slots.used > 9) {
			embed.setColor(client.config.embedColorYellow)
		} else embed.setColor(client.config.embedColorGreen)
        embed.setDescription(`${FSdss.data.slots.used === 0 ? '*No players online*' : playerInfo.join("\n")}`);
        embed.addFields({name: `**Server Statistics**`, value: [
                `**Money:** $${FScsg === undefined ? null : parseInt(FScsg.statistics.money._text).toLocaleString('en-US')}`,
                `**In-game time:** ${('0' + Math.floor((FSdss.data.server.dayTime/3600/1000))).slice(-2)}:${('0' + Math.floor((FSdss.data.server.dayTime/60/1000)%60)).slice(-2) ?? null}`,
                `**Timescale:** ${FScsg === undefined ? null : (FScsg.settings.timeScale._text.slice(0, -5)).toLocaleString('en-US')}x`,
                `**Playtime:** ${FScsg === undefined ? null : client.formatTime((parseInt(FScsg.statistics.playTime._text) * 60 * 1000), 3, { commas: true, longNames: true })}`,
                `**Map:** ${FSdss.data.server.mapName ?? null}`,
                `**Autosave interval:** ${FScsg === undefined ? null : Math.round(parseInt(FScsg.settings.autoSaveInterval._text))} min`,
                `**Game version:** ${FSdss.data.server.version ?? null}`,
                `**Slot usage:** ${FScsg === undefined ? null : parseInt(FScsg.slotSystem._attributes.slotUsage).toLocaleString('en-US')}`
                ].join('\n')
            })
        client.channels.resolve(Channel).messages.fetch(Message).then((msg)=>{ msg.edit({embeds: [embed]})})
        
        switch (serverAcro) {
            case 'PS': // Public Silage
                if (FSdss.data.server.name.length === 0) {
                    if (client.FSCache.ps.status === 1) {
                        logChannel.send({embeds: [new client.embed().setTitle(`${serverAcro} now offline`).setColor(client.config.embedColorYellow)]})
                    }
                    client.FSCache.ps.status = 0;
                } else {
                    if (client.FSCache.ps.status === 0) {
                        logChannel.send({embeds: [new client.embed().setTitle(`${serverAcro} now online`).setColor(client.config.embedColorYellow)]})
                    }
                    client.FSCache.ps.status = 1;
                }
    
                client.FSCache.ps.new = await FSdss.data.slots.players.filter(x => x.isUsed !== false);
    
                adminCheck(client, this.FSCache.ps.new, this.FSCache.ps.old, serverAcro, Whitelist);
                log(client, this.FSCache.ps.new, this.FSCache.ps.old, serverAcro);
                dataPoint(serverAcro, FSdss.data.slots.used);
    
                client.FSCache.ps.old = await FSdss.data.slots.players.filter(x => x.isUsed !== false);
                break;
            case 'PG': // Public Grain
                if (FSdss.data.server.name.length === 0) {
                    if (client.FSCache.pg.status === 1) {
                        logChannel.send({embeds: [new client.embed().setTitle(`${serverAcro} now offline`).setColor(client.config.embedColorYellow)]})
                    }
                    client.FSCache.pg.status = 0;
                } else {
                    if (client.FSCache.pg.status === 0) {
                        logChannel.send({embeds: [new client.embed().setTitle(`${serverAcro} now online`).setColor(client.config.embedColorYellow)]})
                    }
                    client.FSCache.pg.status = 1;
                }
    
                client.FSCache.pg.new = await FSdss.data.slots.players.filter(x => x.isUsed !== false);
    
                adminCheck(client, this.FSCache.pg.new, this.FSCache.pg.old, serverAcro, Whitelist);
                log(client, this.FSCache.pg.new, this.FSCache.pg.old, serverAcro);
                dataPoint(serverAcro, FSdss.data.slots.used);
            
                client.FSCache.pg.old = await FSdss.data.slots.players.filter(x => x.isUsed !== false);
                break;
            case 'MF': // Multi Farm
                if (FSdss.data.server.name.length === 0) {
                    if (client.FSCache.mf.status === 1) {
                        logChannel.send({embeds: [new client.embed().setTitle(`${serverAcro} now offline`).setColor(client.config.embedColorYellow)]})
                    }
                    client.FSCache.mf.status = 0;
                } else {
                    if (client.FSCache.mf.status === 0) {
                        logChannel.send({embeds: [new client.embed().setTitle(`${serverAcro} now online`).setColor(client.config.embedColorYellow)]})
                    }
                    client.FSCache.mf.status = 1;
                }
    
                client.FSCache.mf.new = await FSdss.data.slots.players.filter(x => x.isUsed !== false);
                
                log(client, this.FSCache.mf.new, this.FSCache.mf.old, serverAcro, false);
                dataPoint(serverAcro, FSdss.data.slots.used);
            
                client.FSCache.mf.old = await FSdss.data.slots.players.filter(x => x.isUsed !== false);
                break;
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
        rows.push('━'.repeat(rows[0].length));
        // data
        // remove unicode
        rowsData.map(row => {
            return row.map(element => {
                return element.split('').map(char => {
                    if (char.charCodeAt(0) > 128) return '□';
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
