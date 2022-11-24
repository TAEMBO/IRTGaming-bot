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
	async addPunishment(type: string, member: any, options: db_punishments_passthruOpt, moderator: string) {
		const now = Date.now();
		const { time, reason, interaction } = options;
		const ms = require("ms");
		let timeInMillis;
		if(type !== "mute"){
			timeInMillis = time ? ms(time) : null;
		} else {
			timeInMillis = time ? ms(time) : 2419200000;
		}
		switch (type) {
			case "ban":
				const banData: db_punishments_format = { type, id: this.createId(), member: member.id, moderator, time: now };
				const dm1: Discord.Message = await member.send(`You've been banned from ${interaction.guild.name} ${timeInMillis ? `for ${this.client.formatTime(timeInMillis, 4, { longNames: true, commas: true })} (${timeInMillis}ms)` : "forever"} for reason \`${reason || "unspecified"}\` (Case #${banData.id})`).catch(()=>{return interaction.channel.send('Failed to DM user.')})
				const banResult = await interaction.guild.bans.create(member.id, { reason: `${reason || "unspecified"} | Case #${banData.id}` }).catch((err: Error) => err.message);
				if (typeof banResult === "string") {
					dm1.delete();
					return `Ban was unsuccessful: ${banResult}`;
				} else {
					if (timeInMillis) {
						banData.endTime = now + timeInMillis;
						banData.duration = timeInMillis;
					}
					if (reason) banData.reason = reason;
					this.client.makeModlogEntry(banData, this.client);
					this.addData(banData).forceSave();
					return new this.client.embed()
						.setTitle(`Case #${banData.id}: Ban`)
						.setDescription(`${member?.user?.tag ?? member?.tag}\n<@${member.id}>\n(\`${member.id}\`)`)
						.addFields(
							{name: 'Reason', value: `\`${reason || "unspecified"}\``},
							{name: 'Duration',
								value: `${timeInMillis ? `for ${this.client.formatTime(timeInMillis, 4, {
									longNames: true,
									commas: true
								})} (${timeInMillis}ms)` : "forever"}`
							})
						.setColor(this.client.config.embedColor)
				}
			case "softban":
				const guild = member.guild;
				const softbanData: db_punishments_format = { type, id: this.createId(), member: member.user.id, moderator, time: now };
				const dm2: Discord.Message = await member.send(`You've been softbanned from ${member.guild.name} for reason \`${reason || "unspecified"}\` (Case #${softbanData.id})`).catch(() => {interaction.channel.send(`Failed to DM <@${member.user.id}>.`); return null});
				const softbanResult = await member.ban({ deleteMessageDays: 7, reason: `${reason || "unspecified"} | Case #${softbanData.id}` }).catch((err: Error) => err.message);
				if (typeof softbanResult === "string") {
					if (dm2) dm2.delete();
					return `Softban was unsuccessful: ${softbanResult}`;
				} else {
					const unbanResult = guild.members.unban(softbanData.member, `${reason || "unspecified"} | Case #${softbanData.id}`).catch((err: Error) => err.message);
					if (typeof unbanResult === "string") {
						return `Softban (unban) was unsuccessful: ${softbanResult}`
					} else {
						if (reason) softbanData.reason = reason;
						this.client.makeModlogEntry(softbanData, this.client);
						this.addData(softbanData).forceSave();
						return new this.client.embed()
							.setTitle(`Case #${softbanData.id}: Softban`)
							.setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`)
							.addFields({name: 'Reason', value: `\`${reason || "unspecified"}\``})
							.setColor(this.client.config.embedColor)
					}
				}
			case "kick":
				const kickData: db_punishments_format = { type, id: this.createId(), member: member.user.id, moderator, time: now };
				const dm3: Discord.Message = await member.send(`You've been kicked from ${member.guild.name} for reason \`${reason || "unspecified"}\` (Case #${kickData.id})`).catch(() => {interaction.channel.send(`Failed to DM <@${member.user.id}>.`); return null});
				const kickResult = await member.kick(`${reason || "unspecified"} | Case #${kickData.id}`).catch((err: Error) => err.message);
				if (typeof kickResult === "string") {
					if(dm3) dm3.delete();
					return `Kick was unsuccessful: ${kickResult}`;
				} else {
					if (reason) kickData.reason = reason;
					this.client.makeModlogEntry(kickData, this.client);
					this.addData(kickData).forceSave()
					return new this.client.embed()
						.setTitle(`Case #${kickData.id}: Kick`)
						.setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`)
						.addFields({name: 'Reason', value: `\`${reason || "unspecified"}\``})
						.setColor(this.client.config.embedColor)
				}
			case "mute":
				const muteData: db_punishments_format = { type, id: this.createId(), member: member.user.id, moderator, time: now };
				let muteResult;
				if(this.client.hasModPerms(member)) return "Staff members cannot be muted."
				const dm4: Discord.Message = await member.send(`You've been muted in ${member.guild.name} ${timeInMillis ? `for ${this.client.formatTime(timeInMillis, 4, { longNames: true, commas: true })} (${timeInMillis}ms)` : "forever"} for reason \`${reason || "unspecified"}\` (Case #${muteData.id})`).catch(() => {interaction.channel.send('Failed to DM user.'); return null});
				if(timeInMillis){
				muteResult = await member.timeout(timeInMillis, `${reason || "unspecified"} | Case #${muteData.id}`).catch((err: Error) => err.message);
				} else {
				muteResult = await member.timeout(2419200000, `${reason || "unspecified"} | Case #${muteData.id}`).catch((err: Error) => err.message);
				}
				if (typeof muteResult === "string") {
					if(dm4) dm4.delete();
					return `Mute was unsuccessful: ${muteResult}`;
				} else {
					if (timeInMillis) {
						muteData.endTime = now + timeInMillis;
						muteData.duration = timeInMillis;
					}
					if (reason) muteData.reason = reason;
					this.client.makeModlogEntry(muteData, this.client);
					this.addData(muteData).forceSave();
					const embedm = new this.client.embed()
						.setTitle(`Case #${muteData.id}: Mute`)
						.setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`)
						.addFields(
							{name: 'Reason', value: `\`${reason || "unspecified"}\``},
							{name: 'Duration',
								value: `${this.client.formatTime(timeInMillis, 4, {
									longNames: true,
									commas: true
								})} (${timeInMillis}ms)`
							})
						.setColor(this.client.config.embedColor)
						if (moderator !== '795443537356521502') {return embedm};
				}
			case "warn":
				const warnData: db_punishments_format = { type, id: this.createId(), member: member.user.id, moderator, time: now };
				const warnResult = await member.send(`You've been warned in ${member.guild.name} for reason \`${reason || "unspecified"}\` (Case #${warnData.id})`).catch(() => {interaction.channel.send(`Failed to DM <@${member.user.id}>.`); return null});
				if (typeof warnResult === "string") {
					return `Warn was unsuccessful: ${warnResult}`;
				} else {
					if (reason) warnData.reason = reason;
					this.client.makeModlogEntry(warnData, this.client);
					this.addData(warnData).forceSave();
					const embedw = new this.client.embed()
					.setTitle(`Case #${warnData.id}: Warn`)
					.setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`)
					.addFields({name: 'Reason', value: `\`${reason || "unspecified"}\``})
					.setColor(this.client.config.embedColor)
					if (moderator !== '795443537356521502') {return embedw};
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
						removePunishmentResult.send(`You've been unmuted in ${removePunishmentResult.guild.name}.`);
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
				this.client.makeModlogEntry(removePunishmentData, this.client);
				this._content[this._content.findIndex((x: db_punishments_format) => x.id === punishment.id)].expired = true;
				this.addData(removePunishmentData).forceSave();
				return `Successfully ${punishment.type === "ban" ? "unbanned" : "unmuted"} ${removePunishmentResult?.tag} (${removePunishmentResult?.id}) for reason \`${reason || "unspecified"}\``;
			}
		} else {
			try {
				const removePunishmentData = { type: "removeOtherPunishment", id, cancels: punishment.id, member: punishment.member, reason, moderator, time: now };
				this.client.makeModlogEntry(removePunishmentData, this.client);
				this._content[this._content.findIndex((x: db_punishments_format) => x.id === punishment.id)].expired = true;
				this.addData(removePunishmentData).forceSave();
				return `Successfully removed Case #${punishment.id} (type: ${punishment.type}, user: ${punishment.member}).`;
			} catch (error: any) {
				return `${punishment.type[0].toUpperCase() + punishment.type.slice(1)} removal was unsuccessful: ${error.message}`;
			}
		}
	}
}