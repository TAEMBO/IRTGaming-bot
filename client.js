const { Client, GatewayIntentBits, Partials } = require("discord.js");
const Discord = require("discord.js");
const fs = require("node:fs");
const database = require("./database");
class YClient extends Client {
    constructor(options){
        super({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildBans, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent],
            partials: [Partials.Channel, Partials.Message, Partials.Reaction],
            disableEveryone: true
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
        this.statsGraph = -120;
        this.FSCacheOldPS = [];
        this.FSCacheOldPG = [];
        this.FSCacheOldMF = [];
        this.FSCacheNewPS = [];
        this.FSCacheNewPG = [];
        this.FSCacheNewMF = [];
        this.FSstatusPS;
        this.FSstatusPG;
        this.FSstatusMF;
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
        const axios = require("axios");
        const xjs = require('xml-js');
        const PGdata = require('./databases/PGPlayerData.json')
        const PSdata = require('./databases/PSPlayerData.json')
        const MFdata = require('./databases/MFPlayerData.json')
        const Whitelist = ["Bernie", "RedbaD", "SpongeBoi69", "Kazmerev", "Hungarian__0101", "Bacon", "Sersha", "Helper B", "777Stupid"]
        const wlChannel = client.channels.resolve(client.config.mainServer.channels.watchlist);
        const logChannel = client.channels.resolve(client.config.mainServer.channels.fslogs)
        const playerInfo = [];
        const serverInfo = [];
        const embed = new client.embed();
        let FSdss;
        let FScsg = undefined;
        let xml;
    
        // Fetch dedicated-server-stats.json
        try {
            FSdss = await axios.get(serverURLdss, {timeout: 5000});
        } catch (err) {
            // Blame Red
            embed.setTitle('Host not responding');
            embed.setColor(client.config.embedColorRed);
            client.channels.resolve(Channel).messages.fetch(Message).then((msg)=>{ msg.edit({embeds: [embed]})});
            console.log(`${serverAcro} dss fail`)
            return;
        }

        // Fech dedicated-server-savegame.xml and convert
        try {
            xml = await axios.get(serverURLcsg, {timeout: 5000});
        } catch (err) {
            // Blame Red
            console.log(`${serverAcro} csg fail`)
            return;
        }
        FScsg = await xjs.xml2js(xml.data, {compact: true, spaces: 2}).careerSavegame;

        setTimeout(() => {
            serverInfo.push(`**Money:** $${parseInt(FScsg === undefined ? null : FScsg.statistics.money._text).toLocaleString('en-US')}`)
            serverInfo.push(`**In-game time:** ${('0' + Math.floor((FSdss.data.server.dayTime/3600/1000))).slice(-2)}:${('0' + Math.floor((FSdss.data.server.dayTime/60/1000)%60)).slice(-2) ?? null}`)
            serverInfo.push(`**Timescale:** x${FScsg === undefined ? null : (FScsg.settings.timeScale._text.slice(0, -5)).toLocaleString('en-US')}`)
            serverInfo.push(`**Playtime:** ${FScsg === undefined ? null : client.formatTime((parseInt(FScsg.statistics.playTime._text) * 60 * 1000), 3, { commas: true, longNames: true })}`)
            serverInfo.push(`**Map:** ${FSdss.data.server.mapName || null}`)
            serverInfo.push(`**Autosave interval:** ${FScsg === undefined ? null : Math.round(parseInt(FScsg.settings.autoSaveInterval._text))} min`)
            serverInfo.push(`**Game version:** ${FSdss.data.server.version || null}`)
            serverInfo.push(`**Slot usage:** ${FScsg === undefined ? null : parseInt(FScsg.slotSystem._attributes.slotUsage).toLocaleString('en-US')}`)
        }, 500)
    
        await FSdss.data.slots.players.forEach(player => {
            if (player.name === undefined) return;
            // Unknown admin login log
            if (player.isAdmin && (!Whitelist.includes(player.name) && !client.FMstaff._content.includes(player.name))) {
                logChannel.send({embeds: [new client.embed().setTitle('ADMIN LOGIN').setDescription(`\`${player.name}\` login into **${FSdss.data.server.name.replace('! IRTGaming|24/7 ', '')}** at <t:${Math.round(new Date() / 1000)}>`).setColor('#ff4d00')]})
            }
            let wlPlayer = ''; // Tag for if player is on watchList
            client.watchList._content.forEach((x) => {
                if (x[0] === player.name) {
                    wlPlayer = '⛔';
                }
            })
            playerInfo.push(`\`${player.name}\` ${wlPlayer}${(player.isAdmin ? ' :detective:' : '')}${(client.FMstaff._content.includes(player.name) ? ':farmer:' : '')}${(client.TFstaff._content.includes(player.name) ? ':angel:' : '')} **|** ${('0' + Math.floor(player.uptime/60)).slice(-2)}:${('0' + (player.uptime % 60)).slice(-2)}`);
        })

        // Stats embed
        embed.setAuthor({name: `${FSdss.data.slots.used}/${FSdss.data.slots.capacity}`})
		if (FSdss.data.slots.used === FSdss.data.slots.capacity) {
			embed.setColor(client.config.embedColorRed)
		} else if (FSdss.data.slots.used > 9) {
			embed.setColor(client.config.embedColorYellow)
		} else embed.setColor(client.config.embedColorGreen)
        embed.setDescription(`${FSdss.data.slots.used === 0 ? '*No players online*' : playerInfo.join("\n")}`);
        setTimeout(() => {
            embed.addFields(
                {name: `**Server Statistics**`, value: serverInfo.join('\n')}
            )
            client.channels.resolve(Channel).messages.fetch(Message).then((msg)=>{ msg.edit({embeds: [embed]})})
        }, 1000)

        if (serverAcro === 'PS') {
            PSdata.push(FSdss.data.slots.used);
            fs.writeFileSync(__dirname + "/databases/PSPlayerData.json", JSON.stringify(PSdata));

            if (FSdss.data.server.name.length === 0) {
                if (client.FSstatusPS === 1) {
                    logChannel.send({embeds: [new client.embed().setTitle(`${serverAcro} now offline`).setColor(client.config.embedColorYellow)]})
                }
                client.FSstatusPS = 0;
            } else {
                if (client.FSstatusPS === 0) {
                    logChannel.send({embeds: [new client.embed().setTitle(`${serverAcro} now online`).setColor(client.config.embedColorYellow)]})
                }
                client.FSstatusPS = 1;
            }
            
            client.FSCacheNewPS = [];
            await FSdss.data.slots.players.forEach(player => {
                if (player.name === undefined) return;
                client.FSCacheNewPS.push(player.name);
            })

            // Filter for players leaving
            const missingElementsLeave = client.FSCacheOldPS.filter(element => !client.FSCacheNewPS.includes(element)); // Filter names that were in the first fetch but not the second. Thanks to LebSter#0617 for this on The Coding Den Discord server
            for (const missingElement of missingElementsLeave) {
                // watchList
                client.watchList._content.forEach((x) => {
                    if (x[0] === missingElement) {
                        wlChannel.send({embeds: [new client.embed().setTitle('WATCHLIST').setDescription(`\`${missingElement}\` left **${serverAcro}** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorRed)]})
                    } // Hopefully that person got banned
                })
                logChannel.send({embeds: [new client.embed().setDescription(`\`${missingElement}\` ${(client.FMstaff._content.includes(missingElement) ? ':farmer:' : '')}${(client.TFstaff._content.includes(missingElement) ? ':angel:' : '')} left **${serverAcro}** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorRed)]})
            }
            
            // Filter for players joining
            if (client.FSCacheOldPS.length === 0) {
                if (client.uptime > 31000) {
                    client.FSCacheNewPS.forEach((q) => {
                        // watchList
                        client.watchList._content.forEach((x) => {
                            if (x[0] === q) {
                                wlChannel.send({embeds: [new client.embed().setTitle('WATCHLIST').setDescription(`\`${x[0]}\` joined **${serverAcro}** at <t:${Math.round(new Date() / 1000)}:t>`).setFooter({text: `Reason: ${x[1]}`}).setColor(client.config.embedColorGreen)]})
                            } // Oh no, go get em Toast
                        })
                        logChannel.send({embeds: [new client.embed().setDescription(`\`${q}\` ${(client.FMstaff._content.includes(q) ? ':farmer:' : '')}${(client.TFstaff._content.includes(q) ? ':angel:' : '')} joined **${serverAcro}** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorGreen)]})
                    })
                }
            } else {
                const missingElementsJoin = client.FSCacheNewPS.filter(element => !client.FSCacheOldPS.includes(element)); // Filter names that were in the second fetch but not the first. Thanks to LebSter#0617 for this on The Coding Den Discord server
                for (const missingElement of missingElementsJoin) {
                    // watchList
                    client.watchList._content.forEach((x) => {
                        if (x[0] === missingElement) {
                            wlChannel.send({embeds: [new client.embed().setTitle('WATCHLIST').setDescription(`\`${missingElement}\` joined **${serverAcro}** at <t:${Math.round(new Date() / 1000)}:t>`).setFooter({text: `Reason: ${x[1]}`}).setColor(client.config.embedColorGreen)]})
                        } // Oh no, go get em Toast
                    })
                    logChannel.send({embeds: [new client.embed().setDescription(`\`${missingElement}\` ${(client.FMstaff._content.includes(missingElement) ? ':farmer:' : '')}${(client.TFstaff._content.includes(missingElement) ? ':angel:' : '')} joined **${serverAcro}** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorGreen)]})
                } 
            }
        
            client.FSCacheOldPS = [];
            await FSdss.data.slots.players.forEach(player => {
                if (player.name === undefined) return;
                client.FSCacheOldPS.push(player.name);
            })

        } else if (serverAcro === 'PG') {
            PGdata.push(FSdss.data.slots.used);  
            fs.writeFileSync(__dirname + "/databases/PGPlayerData.json", JSON.stringify(PGdata));
            
            client.FSCacheNewPG = [];
            await FSdss.data.slots.players.forEach(player => {
                if (player.name === undefined) return;
                client.FSCacheNewPG.push(player.name);
            })

            if (FSdss.data.server.name.length === 0) {
                if (client.FSstatusPG === 1) {
                    logChannel.send({embeds: [new client.embed().setTitle(`${serverAcro} now offline`).setColor(client.config.embedColorYellow)]})
                }
                client.FSstatusPG = 0;
            } else {
                if (client.FSstatusPG === 0) {
                    logChannel.send({embeds: [new client.embed().setTitle(`${serverAcro} now online`).setColor(client.config.embedColorYellow)]})
                }
                client.FSstatusPG = 1;
            }

            // Filter for players leaving
            const missingElementsLeave = client.FSCacheOldPG.filter(element => !client.FSCacheNewPG.includes(element)); // Filter names that were in the first fetch but not the second. Thanks to LebSter#0617 for this on The Coding Den Discord server
            for (const missingElement of missingElementsLeave) {
                // watchList
                client.watchList._content.forEach((x) => {
                    if (x[0] === missingElement) {
                        wlChannel.send({embeds: [new client.embed().setTitle('WATCHLIST').setDescription(`\`${missingElement}\` left **${serverAcro}** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorRed)]})
                    } // Hopefully that person got banned
                })
                logChannel.send({embeds: [new client.embed().setDescription(`\`${missingElement}\` ${(client.FMstaff._content.includes(missingElement) ? ':farmer:' : '')}${(client.TFstaff._content.includes(missingElement) ? ':angel:' : '')} left **${serverAcro}** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorRed)]})
            }
            
            // Filter for players joining
            if (client.FSCacheOldPG.length === 0) {
                if (client.uptime > 31000) {
                    client.FSCacheNewPG.forEach((q) => {
                        // watchList
                        client.watchList._content.forEach((x) => {
                            if (x[0] === q) {
                                wlChannel.send({embeds: [new client.embed().setTitle('WATCHLIST').setDescription(`\`${x[0]}\` joined **${serverAcro}** at <t:${Math.round(new Date() / 1000)}:t>`).setFooter({text: `Reason: ${x[1]}`}).setColor(client.config.embedColorGreen)]})
                            } // Oh no, go get em Toast
                        })
                        logChannel.send({embeds: [new client.embed().setDescription(`\`${q}\` ${(client.FMstaff._content.includes(q) ? ':farmer:' : '')}${(client.TFstaff._content.includes(q) ? ':angel:' : '')} joined **${serverAcro}** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorGreen)]})
                    })
                }
            } else {
                const missingElementsJoin = client.FSCacheNewPG.filter(element => !client.FSCacheOldPG.includes(element)); // Filter names that were in the second fetch but not the first. Thanks to LebSter#0617 for this on The Coding Den Discord server
                for (const missingElement of missingElementsJoin) {
                    // watchList
                    client.watchList._content.forEach((x) => {
                        if (x[0] === missingElement) {
                            wlChannel.send({embeds: [new client.embed().setTitle('WATCHLIST').setDescription(`\`${missingElement}\` joined **${serverAcro}** at <t:${Math.round(new Date() / 1000)}:t>`).setFooter({text: `Reason: ${x[1]}`}).setColor(client.config.embedColorGreen)]})
                        } // Oh no, go get em Toast
                    })
                    logChannel.send({embeds: [new client.embed().setDescription(`\`${missingElement}\` ${(client.FMstaff._content.includes(missingElement) ? ':farmer:' : '')}${(client.TFstaff._content.includes(missingElement) ? ':angel:' : '')} joined **${serverAcro}** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorGreen)]})
                } 
            }
        
            client.FSCacheOldPG = [];
            await FSdss.data.slots.players.forEach(player => {
                if (player.name === undefined) return;
                client.FSCacheOldPG.push(player.name);
            })

        } else if (serverAcro === 'MF') {
            MFdata.push(FSdss.data.slots.used);  
            fs.writeFileSync(__dirname + "/databases/MFPlayerData.json", JSON.stringify(MFdata));
            
            client.FSCacheNewMF = [];
            await FSdss.data.slots.players.forEach(player => {
                if (player.name === undefined) return;
                client.FSCacheNewMF.push(player.name);
            })

            if (FSdss.data.server.name.length === 0) {
                if (client.FSstatusMF === 1) {
                    logChannel.send({embeds: [new client.embed().setTitle(`${serverAcro} now offline`).setColor(client.config.embedColorYellow)]})
                }
                client.FSstatusMF = 0;
            } else {
                if (client.FSstatusMF === 0) {
                    logChannel.send({embeds: [new client.embed().setTitle(`${serverAcro} now online`).setColor(client.config.embedColorYellow)]})
                }
                client.FSstatusMF = 1;
            }

            // Filter for players leaving
            const missingElementsLeave = client.FSCacheOldMF.filter(element => !client.FSCacheNewMF.includes(element)); // Filter names that were in the first fetch but not the second. Thanks to LebSter#0617 for this on The Coding Den Discord server
            for (const missingElement of missingElementsLeave) {
                logChannel.send({embeds: [new client.embed().setDescription(`\`${missingElement}\` ${(client.FMstaff._content.includes(missingElement) ? ':farmer:' : '')}${(client.TFstaff._content.includes(missingElement) ? ':angel:' : '')} left **${serverAcro}** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorRed)]})
            }
            
            // Filter for players joining
            if (client.FSCacheOldMF.length === 0) {
                if (client.uptime > 31000) {
                    client.FSCacheNewMF.forEach((q) => {
                        logChannel.send({embeds: [new client.embed().setDescription(`\`${q}\` ${(client.FMstaff._content.includes(q) ? ':farmer:' : '')}${(client.TFstaff._content.includes(q) ? ':angel:' : '')} joined **${serverAcro}** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorGreen)]})
                    })
                }
            } else {
                const missingElementsJoin = client.FSCacheNewMF.filter(element => !client.FSCacheOldMF.includes(element)); // Filter names that were in the second fetch but not the first. Thanks to LebSter#0617 for this on The Coding Den Discord server
                for (const missingElement of missingElementsJoin) {
                    logChannel.send({embeds: [new client.embed().setDescription(`\`${missingElement}\` ${(client.FMstaff._content.includes(missingElement) ? ':farmer:' : '')}${(client.TFstaff._content.includes(missingElement) ? ':angel:' : '')} joined **${serverAcro}** at <t:${Math.round(new Date() / 1000)}:t>`).setColor(client.config.embedColorGreen)]})
                } 
            }
            client.FSCacheOldMF = [];
            await FSdss.data.slots.players.forEach(player => {
                if (player.name === undefined) return;
                client.FSCacheOldMF.push(player.name);
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
