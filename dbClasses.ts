import YClient from './client';
import { db_playerTimes_format, db_punishments_format, db_punishments_passthruOpt } from './interfaces'
import Database from './database';
import Discord from 'discord.js';

export class bannedWords extends Database {
    client: YClient;
    constructor(client: YClient) {
        super(client, "./databases/bannedWords.json", "array");
        this.client = client;
    }
}
export class TFstaff extends Database {
    client: YClient;
    constructor(client: YClient) {
        super(client ,"./databases/TFstaff.json", "array");
        this.client = client;
    }
}
export class FMstaff extends Database {
    client: YClient;
    constructor(client: YClient) {
        super(client, "./databases/FMstaff.json", "array");
        this.client = client;
    }
}
export class watchList extends Database {
    client: YClient;
    constructor(client: YClient) {
        super(client, "./databases/watchList.json", "array");
        this.client = client;
    }
}
export class playerTimes extends Database {
    client: YClient;
    constructor(client: YClient) {
        super(client, "./databases/playerTimes.json", "object")
        this.client = client;
    }
    addPlayerTime(playerName: string, time: number) {
		const now = Math.round(Date.now() / 1000);
        const playerData = this._content[playerName];
        if (playerData) {
			this._content[playerName].time = playerData.time + time;
			this._content[playerName].lastOn = now;
		} else {
			this._content[playerName] = { time: time, lastOn: now };
		}
        return this;
    }
	decrement(playerName: string, time: number) {
        this._content[playerName].time = this._content[playerName].time - time;
        return this;
    }
    getPlayer(playerName: string): db_playerTimes_format | null {
        return this._content[playerName] || null;
    }
}
export class userLevels extends Database {
    client: YClient;
    constructor(client: YClient) {
        super(client, "./databases/userLevels.json", "object");
        this.client = client;
    }
    incrementUser(userid: string) {
		const data = this._content[userid];

		if (data) {
			this._content[userid].messages++;
			if (data.messages >= this.algorithm(data.level+2)) {
				while (data.messages > this.algorithm(data.level+1)) {
					this._content[userid].level++;
					console.log(`${userid} EXTENDED LEVELUP ${this._content[userid].level}`)
				}
			} else if (data.messages >= this.algorithm(data.level+1)) {
				this._content[userid].level++;
				(this.client.channels.resolve(this.client.config.mainServer.channels.botcommands) as Discord.TextChannel).send({content: `Well done <@${userid}>, you made it to **level ${data.level}**!`})
			}
		} else  {
			this._content[userid] = {messages: 1, level: 0};
		}
	}
	algorithm(level: number) {
		return level*level*15;
	}
}
export class punishments extends Database {
    client: YClient;
    constructor(client: YClient) {
        super(client, "./databases/punishments.json", "array");
        this.client = client;
    }
    createId() {
		return Math.max(...this.client.punishments._content.map((x: db_punishments_format) => x.id), 0) + 1;
	}
	makeModlogEntry(data: db_punishments_format) {
        const cancels = data.cancels ? this.client.punishments._content.find((x: db_punishments_format) => x.id === data.cancels) : null;
    
        // format data into embed
        const embed = new this.client.embed()
            .setTitle(`${this.client.formatPunishmentType(data, this.client, cancels)} | Case #${data.id}`)
            .addFields(
            	{name: '🔹 User', value: `${data.member.tag}\n<@${data.member.id}>\n\`${data.member.id}\``, inline: true},
            	{name: '🔹 Moderator', value: `<@${data.moderator}> \`${data.moderator}\``, inline: true},
            	{name: '\u200b', value: '\u200b', inline: true},
            	{name: '🔹 Reason', value: `\`${data.reason}\``, inline: true})
            .setColor(this.client.config.embedColor)
            .setTimestamp(data.time)
        if (data.duration) {
            embed.addFields(
            	{name: '🔹 Duration', value: this.client.formatTime(data.duration, 100), inline: true},
            	{name: '\u200b', value: '\u200b', inline: true}
            )
        }
        if (data.cancels) embed.addFields({name: '🔹 Overwrites', value: `This case overwrites Case #${cancels.id} \`${cancels.reason}\``});
    
        // send embed in modlog channel
        (this.client.channels.cache.get(this.client.config.mainServer.channels.staffreports) as Discord.TextChannel).send({embeds: [embed]});
    };
	getTense(type: string) { // Get past tense form of punishment type, grammar yes
		return {
			ban: 'banned',
			softban: 'softbanned',
			kick: 'kicked',
			mute: 'muted',
			warn: 'warned'
		}[type]
	}
	async addPunishment(type: string, options: db_punishments_passthruOpt, moderator: string, reason: string, User: Discord.User, GuildMember?: Discord.GuildMember) {
		const { time, interaction } = options;
		const ms = require('ms');
		const now = Date.now();
		const guild = this.client.guilds.cache.get(this.client.config.mainServer.id) as Discord.Guild;
		const punData: db_punishments_format = { type, id: this.createId(), member: {tag: User.tag, id: User.id}, reason, moderator, time: now }
		const inOrFromBoolean = ['warn', 'mute'].includes(type) ? 'in' : 'from'; // Use 'in' if the punishment doesn't remove the member from the server, eg. kick, softban, ban
		const auditLogReason = `${reason} | Case #${punData.id}`;
		const embed = new this.client.embed()
			.setColor(this.client.config.embedColor)
			.setTitle(`Case #${punData.id}: ${type[0].toUpperCase() + type.slice(1)}`)
			.setDescription(`${User.tag}\n<@${User.id}>\n(\`${User.id}\`)`)
			.addFields({name: 'Reason', value: reason})
		let punResult;
		let timeInMillis;
		let DM;

		if (type == "mute") {
			timeInMillis = time ? ms(time) : 2419140000; // Timeouts have a limit of 4 weeks
		} else {
			timeInMillis = time ? ms(time) : null;
		}
		const durationText = timeInMillis ? ` for ${this.client.formatTime(timeInMillis, 4, { longNames: true, commas: true })}` : '';

		// Add field for duration if time is specified
		if (time) embed.addFields({name: 'Duration', value: durationText});

		if (GuildMember) {
			try {
				DM = await GuildMember.send(`You've been ${this.getTense(type)} ${inOrFromBoolean} ${guild.name}${durationText} for reason \`${reason}\` (case #${punData.id})`);
			} catch (err: any) {
				embed.setFooter({text: 'Failed to DM member of punishment'});
			}
		}

		if (['ban', 'softban'].includes(type)) {
			const banned = await guild.bans.fetch(User.id).catch(() => undefined);
			if (!banned) {
				punResult = await guild.bans.create(User.id, {reason: `${reason} | Case #${punData.id}`}).catch((err: Error) => err.message);
			} else {
				punResult = 'User is already banned.';
			}
		} else if (type == 'kick') {
			punResult = await GuildMember?.kick(auditLogReason).catch((err: Error) => err.message);
		} else if (type == 'mute') {
			punResult = await GuildMember?.timeout(timeInMillis, auditLogReason).catch((err: Error) => err.message);
		}

		if (type == 'softban' && typeof punResult != 'string') { // If type was softban and it was successful, continue with softban (unban)
			punResult = await guild.bans.remove(User.id, auditLogReason).catch((err: Error) => err.message);
		}

		if (timeInMillis && ['mute', 'ban'].includes(type)) { // If type is mute or ban, specify duration and endTime
			punData.endTime = now + timeInMillis;
			punData.duration = timeInMillis;
		}

		if (typeof punResult == 'string') { // Punishment was unsuccessful
			if (DM) DM.delete();
			if (interaction) {
				return interaction.editReply(punResult);
			} else {
				return punResult;
			}
		} else { // Punishment was successful
			this.makeModlogEntry(punData);
			this.client.punishments.addData(punData).forceSave();

			if (interaction) {
				return interaction.editReply({embeds: [embed]});
			} else {
				return punResult;
			}
		}
	}
	async removePunishment(caseId: number, moderator: string, reason: string, interaction?: Discord.ChatInputCommandInteraction<"cached">) {
		const now = Date.now();
		const id = this.createId();
		const punishment: db_punishments_format = this._content.find((x: db_punishments_format) => x.id === caseId);
		const guild = this.client.guilds.cache.get(this.client.config.mainServer.id) as Discord.Guild;
		const auditLogReason = `${reason} | Case #${punishment.id}`;
		const User = await this.client.users.fetch(punishment.member.id) as Discord.User;
		const GuildMember = await guild.members.fetch(punishment.member.id).catch(() => undefined);
		
		let removePunishmentData: db_punishments_format = { type: `un${punishment.type}`, id, cancels: punishment.id, member: punishment.member, reason, moderator, time: now };
		let removePunishmentResult;

		if (punishment.type == 'ban') {
			removePunishmentResult = guild.bans.remove(punishment.member.id, auditLogReason).catch((err: Error) => err.message);
		} else if (punishment.type == 'mute') {

			if (GuildMember) {
				removePunishmentResult = GuildMember.timeout(null, auditLogReason).catch((err: Error) => err.message);
				GuildMember.send(`You've been unmuted in ${guild.name}.`).catch((err: Error) => console.log(err.message));
			} else {
				this._content.find((x: db_punishments_format) => x.id == caseId).expired = true;
			}
		} else {
			removePunishmentData.type = 'removeOtherPunishment';
		}

		if (typeof removePunishmentResult == 'string') { // Unpunish was unsuccessful
			if (interaction) {
				return interaction.reply(removePunishmentResult);
			} else {
				return removePunishmentResult;
			}
		} else { // Unpunish was successful
			this._content.find((x: db_punishments_format) => x.id == caseId).expired = true;
			this.makeModlogEntry(removePunishmentData);
			this.addData(removePunishmentData).forceSave();

			if (interaction) {
				return interaction.reply({embeds: [new this.client.embed()
					.setColor(this.client.config.embedColor)
					.setTitle(`Case #${removePunishmentData.id}: ${removePunishmentData.type[0].toUpperCase() + removePunishmentData.type.slice(1)}`)
					.setDescription(`${User.tag}\n<@${User.id}>\n(\`${User.id}\`)`)
					.addFields(
						{name: 'Reason', value: reason},
						{name: 'Overwrites', value: `Case #${punishment.id}`}
					)
				]})
			} else {
				return `Successfully ${this.getTense(removePunishmentData.type)}d ${User.tag} (${User.id}) for reason '${reason}'`;
			}

		}
	}
}