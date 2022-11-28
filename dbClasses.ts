import YClient from './client';
import { db_punishments_format, db_punishments_passthruOpt, db_tictactoe_tttGame, db_tictactoe_tttPlayer} from './interfaces'
import Database from './database';
import Discord from 'discord.js';

export class bannedWords extends Database {
    client: YClient;
    constructor(client: YClient) {
        super("./databases/bannedWords.json", "array");
        this.client = client;
    }
}
export class TFstaff extends Database {
    client: YClient;
    constructor(client: YClient) {
        super("./databases/TFstaff.json", "array");
        this.client = client;
    }
}
export class FMstaff extends Database {
    client: YClient;
    constructor(client: YClient) {
        super("./databases/FMstaff.json", "array");
        this.client = client;
    }
}
export class watchList extends Database {
    client: YClient;
    constructor(client: YClient) {
        super("./databases/watchList.json", "array");
        this.client = client;
    }
}
export class playerTimes extends Database {
    client: YClient;
    constructor(client: YClient) {
        super('./databases/playerTimes.json', 'array')
        this.client = client;
    }
    addPlayerTime(playerName: string, time: number) {
        const amount = this._content[playerName];
        if (amount) this._content[playerName] = amount + time;
        else this._content[playerName] = time;
        return this;
    }
	decrement(playerName: string, time: number) {
        this._content[playerName] = this._content[playerName] - time;
        return this;
    }
    getPlayer(playerName: string): number {
        return this._content[playerName] || 0;
    }
}
export class userLevels extends Database {
    client: YClient;
    constructor(client: YClient) {
        super("./databases/userLevels.json", "object");
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
export class tictactoe extends Database {
    client: YClient;
    constructor(client: YClient) {
        super("./databases/ttt.json", "array");
        this.client = client;
    }
    getTotalGames(): number {
		return this._content.length;
	}
	getRecentGames(amount: number): Array<db_tictactoe_tttGame> {
		return this._content.sort((a: db_tictactoe_tttGame, b: db_tictactoe_tttGame) => b.startTime - a.startTime).slice(0, amount - 1);
	}
	getAllPlayers() {
		const players: any = {};
		this._content.forEach((game: db_tictactoe_tttGame) => {
			game.players.forEach((player: string) => {
				if (!players[player]) players[player] = { wins: 0, losses: 0, draws: 0, total: 0 } as db_tictactoe_tttPlayer;
				players[player].total++;
				if (game.draw) return players[player].draws++;
				if (player === game.winner) {
					return players[player].wins++;
				} else {
					return players[player].losses++;
				}
			});
		});
		return players;
	}
	getBestPlayers(amount: number) {
		return Object.entries<db_tictactoe_tttPlayer>(this.getAllPlayers()).filter((x) => x[1].total >= 10).sort((a, b) => b[1].wins / b[1].total - a[1].wins / a[1].total).slice(0, amount - 1);
	}
	getMostActivePlayers(amount: number) {
		return Object.entries<db_tictactoe_tttPlayer>(this.getAllPlayers()).sort((a, b) => b[1].total - a[1].total).slice(0, amount - 1);
	}
	// player stats
	getPlayerGames(player: string) {
		return this._content.filter((x: db_tictactoe_tttGame) => x.players.includes(player));
	}
	getPlayerRecentGames(player: string, amount: number) {
		return this._content.filter((x: db_tictactoe_tttGame) => x.players.includes(player)).sort((a: db_tictactoe_tttGame, b: db_tictactoe_tttGame) => b.startTime - a.startTime).slice(0, amount - 1);
	}
	calcWinPercentage(player: db_tictactoe_tttPlayer) {
		return ((player.wins / player.total) * 100).toFixed(2) + "%";
	}
}
export class punishments extends Database {
    client: YClient;
    constructor(client: YClient) {
        super('./databases/punishments.json', 'array');
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
            	{name: '🔹 User', value: `<@${data.member}> \`${data.member}\``, inline: true},
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
		switch (type) {
			case 'ban':
				return 'banned';
			case 'softban':
				return 'softbanned';
			case 'kick':
				return 'kicked';
			case 'mute':
				return 'muted';
			case 'warn':
				return 'warned';
		}
	}
	async addPunishment(type: string, options: db_punishments_passthruOpt, moderator: string, reason: string, User: Discord.User, GuildMember?: Discord.GuildMember) {
		const { time, interaction } = options;
		const ms = require('ms');
		const now = Date.now();
		const guild = this.client.guilds.cache.get(this.client.config.mainServer.id) as Discord.Guild;
		const punData: db_punishments_format = { type, id: this.createId(), member: User.id, reason, moderator, time: now }
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

		// Add field for duration if time is specified
		if (time) embed.addFields({name: 'Duration', value: `${timeInMillis ? `for ${this.client.formatTime(timeInMillis, 4, { longNames: true, commas: true })}` : "forever"}`})

		if (GuildMember) {
			try {
				DM = await GuildMember.send(`You've been ${this.getTense(type)} from ${guild.name}${time ? (timeInMillis ? ` for ${this.client.formatTime(timeInMillis, 4, { longNames: true, commas: true })}` : 'forever') : ''} for reason \`${reason}\` (case #${punData.id})`);
			} catch (err: any) {
				embed.setFooter({text: 'Failed to DM member of punishment'});
			}
		}

		if (['ban', 'softban'].includes(type)) {
			punResult = await guild.bans.create(User.id, {reason: `${reason} | Case #${punData.id}`}).catch((err: Error) => err.message);
		} else if (type == 'kick') {
			punResult = await GuildMember?.kick(`${reason} | Case #${punData.id}`).catch((err: Error) => err.message);
		} else if (type == 'mute') {
			punResult = await GuildMember?.timeout(timeInMillis, `${reason} | Case #${punData.id}`).catch((err: Error) => err.message);
		}

		if (type == 'softban' && typeof punResult != 'string') { // If type was softban and it was successful, continue with softban (unban)
			punResult = await guild.bans.remove(User.id, `${reason} | Case #${punData.id}`).catch((err: Error) => err.message);
		}

		if (timeInMillis && ['mute', 'ban'].includes(type)) { // If type is mute or ban, specify duration and endTime
			punData.endTime = now + timeInMillis;
			punData.duration = timeInMillis;
		}

		if (typeof punResult == 'string') { // Punishment was unsuccessful
			if (DM) DM.delete();
			if (interaction) {
				return interaction.reply(punResult);
			} else {
				return punResult;
			}
		} else { // Punishment was successful
			this.makeModlogEntry(punData);
			this.client.punishments.addData(punData).forceSave();

			if (interaction) {
				return interaction.reply({embeds: [embed]});
			} else {
				return punResult;
			}
		}

	}
	async removePunishment(caseId: number, moderator: any, reason: string): Promise<any> {
		const now = Date.now();
		const punishment = this._content.find((x: db_punishments_format) => x.id === caseId);
		const id = this.createId();
		if (!punishment) return "Punishment not found.";
		if (["ban", "mute"].includes(punishment.type)) {
			const guild = this.client.guilds.cache.get(this.client.config.mainServer.id) as Discord.Guild;
			let removePunishmentResult;
			if (punishment.type === "ban") {
				// unban
				removePunishmentResult = await guild.members.unban(punishment.member, `${reason || "unspecified"} | Case #${id}`).catch((err: TypeError) => err.message); // unbanning returns a user
			} else if (punishment.type === "mute") {
				// remove role
				const member = await guild.members.fetch(punishment.member).catch(err => undefined);
				if (member) {
					removePunishmentResult = await member
					
					if (typeof removePunishmentResult !== "string") {
						member.timeout(null, `${reason || "unspecified"} | Case #${id}`)
						removePunishmentResult.send(`You've been unmuted in ${removePunishmentResult.guild.name}.`).catch((err) => console.log(err.message));
						removePunishmentResult = removePunishmentResult.user; // removing a role returns a guildmember
					}
				} else {
					// user has probably left. quietly remove punishment from json
					const removePunishmentData = { type: `un${punishment.type}`, id, cancels: punishment.id, member: punishment.member, reason, moderator, time: now };
					this._content[this._content.findIndex((x: db_punishments_format) => x.id === punishment.id)].expired = true;
					this.addData(removePunishmentData).forceSave();
				}
			}
			if (typeof removePunishmentResult === "string") return `Un${punishment.type} was unsuccessful: ${removePunishmentResult}`;
			else {
				const removePunishmentData = { type: `un${punishment.type}`, id, cancels: punishment.id, member: punishment.member, reason, moderator, time: now };
				this.makeModlogEntry(removePunishmentData);
				this._content[this._content.findIndex((x: db_punishments_format) => x.id === punishment.id)].expired = true;
				this.addData(removePunishmentData).forceSave();
				return `Successfully ${punishment.type === "ban" ? "unbanned" : "unmuted"} ${removePunishmentResult?.tag} (${removePunishmentResult?.id}) for reason \`${reason || "unspecified"}\``;
			}
		} else {
			try {
				const removePunishmentData = { type: "removeOtherPunishment", id, cancels: punishment.id, member: punishment.member, reason, moderator, time: now };
				this.makeModlogEntry(removePunishmentData);
				this._content[this._content.findIndex((x: db_punishments_format) => x.id === punishment.id)].expired = true;
				this.addData(removePunishmentData).forceSave();
				return `Successfully removed Case #${punishment.id} (type: ${punishment.type}, user: ${punishment.member}).`;
			} catch (error: any) {
				return `${punishment.type[0].toUpperCase() + punishment.type.slice(1)} removal was unsuccessful: ${error.message}`;
			}
		}
	}
}