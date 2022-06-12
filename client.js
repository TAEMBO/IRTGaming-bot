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
    async FSstats(client, interaction, serverName) {
        const axios = require("axios");
		const embed = new client.embed()
        const playerInfo = [];
        let FSserver;
        try {
            FSserver = await axios.get(serverName, {timeout: 2000});
        } catch (err) {
            return interaction.reply('Server did not respond');
        }
        await FSserver.data.slots.players.forEach(player => {
        if (player.name === undefined) return;
        playerInfo.push(`\`${player.name}\` ${(player.isAdmin ? ' :detective:' : '')}${(client.FMstaff._content.includes(player.name) ? ':farmer:' : '')}${(client.TFstaff._content.includes(player.name) ? ':angel:' : '')} **|** ${('0' + Math.floor(player.uptime/60)).slice(-2)}:${('0' + (player.uptime % 60)).slice(-2)}`);
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
		interaction.reply({embeds: [embed]})
    }
    async FSstatsLoop(client, serverName, Channel, Message) {
        const axios = require("axios");
        const channel_embed = client.channels.resolve(Channel);
        const channel_log = client.channels.resolve(client.config.mainServer.channels.fslogs);
		const embed = new client.embed()
        const playerInfo = [];
        let FSserver;
        try {
            FSserver = await axios.get(serverName, {timeout: 2000});
        } catch (err) {
            embed.setTitle('Server not responding');
            embed.setColor(client.config.embedColorRed);
            channel_embed.messages.fetch(Message).then((msg)=>{ msg.edit({embeds: [embed]})});
            return;
        }
        await FSserver.data.slots.players.forEach(player => {
        if (player.name === undefined) return;
        playerInfo.push(`\`${player.name}\` ${(player.isAdmin ? ' :detective:' : '')}${(client.FMstaff._content.includes(player.name) ? ':farmer:' : '')}${(client.TFstaff._content.includes(player.name) ? ':angel:' : '')} **|** ${('0' + Math.floor(player.uptime/60)).slice(-2)}:${('0' + (player.uptime % 60)).slice(-2)}`);
		if (player.isAdmin && !client.FMstaff._content.includes(player.name)) {
			channel_log.send(`\`${player.name}\` | \`${FSserver.data.server.name}\` | <t:${Math.round(new Date() / 1000)}>`)
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
		channel_embed.messages.fetch(Message).then((msg)=>{ msg.edit({embeds: [embed]})})
    }
    async FSstatsAll (client, serverName, embed, totalCount) {
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
        if (!client.hasModPerms(client, interaction.member)) return interaction.reply({content: `You need the <@&${client.config.mainServer.roles.mod}> role to use this command.`, ephemeral: true, allowedMentions: {roles: false}});
        if (type !== ('warn' || 'mute') && interaction.member.roles.cache.has(client.config.mainServer.roles.helper)) return interaction.reply({content: `You need the <@&${client.config.mainServer.roles.mod}> role to use this command.`, ephemeral: true, allowedMentions: {roles: false}});
        const member = interaction.options.getMember("member");
        const time = interaction.options.getString("time");
        const reason = interaction.options.getString("reason") ?? "None";
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
