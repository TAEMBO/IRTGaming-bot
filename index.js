const Discord = require("discord.js");
const YClient = require("./client");
const client = new YClient();
client.init();
const fs = require("fs");
const path = require('path');

console.log(client.config.botSwitches)

// global properties
client.on("ready", async () => {
	client.guilds.cache.forEach(async (e)=>{await e.members.fetch();});
	client.channels.resolve(client.config.mainServer.channels.testing_zone).send(`:warning: Bot restarted :warning:\n${client.config.eval.whitelist.map(x => `<@${x}>`).join(' ')}`)
	setInterval(()=>{
		client.guilds.cache.get(client.config.mainServer.id).invites.fetch().then((invs)=>{
			invs.forEach(async(inv)=>{
				client.invites.set(inv.code, {uses: inv.uses, creator: inv.inviter.id})
			})
		})
	}, 500000)
	if (client.config.botSwitches.registerCommands) client.guilds.cache.get(client.config.mainServer.id).commands.set(client.registery).catch((e)=>{console.log(`Couldn't register commands bcuz: ${e}`)});

	setInterval(async () => {
		await client.user.setPresence({activities: [{name: 'MF get restarted', type: 3}], status: 'online'});
		// Playing: 0 & 1, Listening: 2, Watching: 3, N/A: 4, Competing in: 5
	}, 60000);
	console.log("\x1b[36m", `Bot active as ${client.user.tag}.`);

	// event handler
	const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
    eventFiles.forEach((file)=>{
    	const event = require(`./events/${file}`);
	    client.on(event.name, async (...args) => event.execute(client, ...args));
    });
});

// error handlers
process.on("unhandledRejection", async (error)=>{
	console.log(error)
	console.log('\x1b[36m', '');
	client.channels.resolve(client.config.mainServer.channels.testing_zone).send({content: `${client.config.eval.whitelist.map(x=>`<@${x}>`).join(", ")}`, embeds: [new client.embed().setTitle("Error Caught!").setColor("#420420").setDescription(`**Error:** \`${error.message}\`\n\n**Stack:** \`${`${error.stack}`.slice(0, 2500)}\``)]})
});
client.on("error", async (error) =>{
	console.log(error)
	console.log('\x1b[36m', '');
	client.channels.resolve(client.config.mainServer.channels.testing_zone).send({content: `${client.config.eval.whitelist.map(x=>`<@${x}>`).join(", ")}`, embeds: [new client.embed().setTitle("Error Caught!").setColor("#420420").setDescription(`**Error:** \`${error.message}\`\n\n**Stack:** \`${`${error.stack}`.slice(0, 2500)}\``)]})
})

// reminder and punishment event loops
const p = path.join(__dirname, './databases/reminders.json');
let remindEmbed = new client.embed()
	.setTitle('Reminder')
	.setColor(client.config.embedColor);
setInterval(async () => {
	let db = require(p);
	const filterLambda = x => x.when < Math.floor(Date.now() / 1000);
	const filter = db.filter(x => filterLambda(x));
	for(let i = 0; i < filter.length; i++){
		remindEmbed = remindEmbed
			.setDescription(`\n\`\`\`${filter[i].what}\`\`\``);
		await (await client.users.fetch(filter[i].who)).send({embeds: [remindEmbed]});
		db.splice(db.findIndex(x => filterLambda(x)), 1);
		fs.writeFileSync(p, db.length !== 0 ? JSON.stringify(db, null, 2) : '[]');
	}
	db = null;
	
	const now = Date.now();
	client.punishments._content.filter(x => x.endTime <= now && !x.expired).forEach(async punishment => {
		console.log(`${punishment.member}\'s ${punishment.type} should expire now`);
		const unpunishResult = await client.punishments.removePunishment(punishment.id, client.user.id, "Time\'s up!");
		console.log(unpunishResult);
	});
}, 5000);

// Farming Simulator 22 stats loops
if (client.config.botSwitches.stats) {
	setInterval(async () => {
		client.FSLoop(client, ps.dss, client.tokens.ps.csg, '891791005098053682', '980240981922291752', 'PS')
		client.FSLoop(client, client.tokens.pg.dss, client.tokens.pg.csg, '729823615096324166', '980241004718329856', 'PG')
		client.FSLoop(client, client.tokens.mf.dss, client.tokens.mf.csg, '982143077554720768', '985586585707900928', 'MF')
	}, 30000)
}

// tic tac toe statistics database
Object.assign(client.tictactoeDb, {
	// global stats
	getTotalGames() {
		return this._content.length;
	},
	getRecentGames(amount) {
		return this._content.sort((a, b) => b.startTime - a.startTime).slice(0, amount - 1);
	},
	getAllPlayers() {
		const players = {};
		this._content.forEach(game => {
			game.players.forEach(player => {
				if (!players[player]) players[player] = { wins: 0, losses: 0, draws: 0, total: 0 };
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
	},
	getBestPlayers(amount) {
		return Object.entries(this.getAllPlayers()).filter(x => x[1].total >= 10).sort((a, b) => b[1].wins / b[1].total - a[1].wins / a[1].total).slice(0, amount - 1);
	},
	getMostActivePlayers(amount) {
		return Object.entries(this.getAllPlayers()).sort((a, b) => b[1].total - a[1].total).slice(0, amount - 1);
	},
	// player stats
	getPlayerGames(player) {
		return this._content.filter(x => x.players.includes(player));
	},
	getPlayerRecentGames(player, amount) {
		return this._content.filter(x => x.players.includes(player)).sort((a, b) => b.startTime - a.startTime).slice(0, amount - 1);
	},
	calcWinPercentage(player) {
		return ((player.wins / player.total) * 100).toFixed(2) + "%";
	}
});

// userLevels
Object.assign(client.userLevels, {
	_milestone() {
		const milestones = [10, 100, 1000, 50000, 69696, 100000, 200000, 300000, 400000, 420000, 500000]; // always keep the previously achived milestone in the array so the progress is correct. here you can stack as many future milestones as youd like
		const total = Object.values(this._content || {}).reduce((a, b) => a + b, 0);
		const next = milestones.find(x => x >= total) || undefined;
		const previous = milestones[milestones.indexOf(next) - 1] || 0;
		return {
			total,
			next,
			previous,
			progress: (total - previous) / (next - previous)
		}
	},
	incrementUser(userid) {
		const amount = this._content[userid];
		if (amount) this._content[userid]++;
		else this._content[userid] = 1;
		// milestone
		const milestone = this._milestone();
		if (milestone && milestone.total === this._milestone().next) {
			const channel = client.channels.resolve("858073309920755773"); // #announcements
			if (!channel) return console.log("tried to send milestone announcement but channel wasnt found");
			channel.send(`:tada: Milestone reached! **${milestone.next.toLocaleString("en-US")}** messages have been sent in this server and recorded by Level Roles. :tada:`);
		}
		return this;
	},
	getUser(userid) {
		return this._content[userid] || 0;
	},
	hasUser(userid) {
		return !!this._content[userid];
	},
	getEligible(guildMember) {
		const age = (Date.now() - guildMember.joinedTimestamp) / 1000 / 60 / 60 / 24;
		const messages = this.getUser(guildMember.user.id);
		return { age, messages };
	},
});

// punishments
Object.assign(client.punishments, {
	createId() {
		return Math.max(...client.punishments._content.map(x => x.id), 0) + 1;
	},
	async addPunishment(type = "", member, options = {}, moderator) {
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
				const banData = { type, id: this.createId(), member: member.user.id, moderator, time: now };
				const dm1 = await member.send(`You've been banned from ${member.guild.name} ${timeInMillis ? `for ${client.formatTime(timeInMillis, 4, { longNames: true, commas: true })} (${timeInMillis}ms)` : "forever"} for reason \`${reason || "unspecified"}\` (Case #${banData.id})`).catch(err => setTimeout(() => interaction.channel.send('Failed to DM user.'), 500));
				const banResult = await member.ban({ reason: `${reason || "unspecified"} | Case #${banData.id}` }).catch(err => err.message);
				if (typeof banResult === "string") {
					dm1.delete();
					return `Ban was unsuccessful: ${banResult}`;
				} else {
					if (timeInMillis) {
						banData.endTime = now + timeInMillis;
						banData.duration = timeInMillis;
					}
					if (reason) banData.reason = reason;
					client.makeModlogEntry(banData, client);
					this.addData(banData);
					this.forceSave();
					return new client.embed()
						.setTitle(`Case #${banData.id}: Ban`)
						.setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`)
						.addFields(
							{name: 'Reason', value: `\`${reason || "unspecified"}\``},
							{name: 'Duration',
								value: `${timeInMillis ? `for ${client.formatTime(timeInMillis, 4, {
									longNames: true,
									commas: true
								})} (${timeInMillis}ms)` : "forever"}`
							})
						.setColor(client.config.embedColor)
				}
			case "softban":
				const guild = member.guild;
				const softbanData = { type, id: this.createId(), member: member.user.id, moderator, time: now };
				const dm2 = await member.send(`You've been softbanned from ${member.guild.name} for reason \`${reason || "unspecified"}\` (Case #${softbanData.id})`).catch(err => setTimeout(() => interaction.channel.send(`Failed to DM <@${member.user.id}>.`), 500));
				const softbanResult = await member.ban({ deleteMessageDays: 7, reason: `${reason || "unspecified"} | Case #${softbanData.id}` }).catch(err => err.message);
				if (typeof softbanResult === "string") {
					dm2.delete();
					return `Softan was unsuccessful: ${softbanResult}`;
				} else {
					const unbanResult = guild.members.unban(softbanData.member, `${reason || "unspecified"} | Case #${softbanData.id}`).catch(err => err.message);
					if (typeof unbanResult === "string") {
						return `Softbanan (unban) was unsuccessful: ${softbanResult}`
					} else {
						if (reason) softbanData.reason = reason;
						client.makeModlogEntry(softbanData, client);
						this.addData(softbanData);
						this.forceSave();
						return new client.embed()
							.setTitle(`Case #${softbanData.id}: Softban`)
							.setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`)
							.addFields({name: 'Reason', value: `\`${reason || "unspecified"}\``})
							.setColor(client.config.embedColor)
					}
				}
			case "kick":
				const kickData = { type, id: this.createId(), member: member.user.id, moderator, time: now };
				const dm3 = await member.send(`You've been kicked from ${member.guild.name} for reason \`${reason || "unspecified"}\` (Case #${kickData.id})`).catch(err => setTimeout(() => interaction.channel.send(`Failed to DM <@${member.user.id}>.`), 500));
				const kickResult = await member.kick(`${reason || "unspecified"} | Case #${kickData.id}`).catch(err => err.message);
				if (typeof kickResult === "string") {
					dm3.delete();
					return `Kick was unsuccessful: ${kickResult}`;
				} else {
					if (reason) kickData.reason = reason;
					client.makeModlogEntry(kickData, client);
					this.addData(kickData);
					this.forceSave();
					return new client.embed()
						.setTitle(`Case #${kickData.id}: Kick`)
						.setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`)
						.addFields({name: 'Reason', value: `\`${reason || "unspecified"}\``})
						.setColor(client.config.embedColor)
				}
			case "mute":
				const muteData = { type, id: this.createId(), member: member.user.id, moderator, time: now };
				let muteResult;
				if(client.hasModPerms(client, member)) return "Staff members cannot be muted."
				const dm4 = await member.send(`You've been muted in ${member.guild.name} ${timeInMillis ? `for ${client.formatTime(timeInMillis, 4, { longNames: true, commas: true })} (${timeInMillis}ms)` : "forever"} for reason \`${reason || "unspecified"}\` (Case #${muteData.id})`).catch(err => setTimeout(() => interaction.channel.send('Failed to DM user.'), 500));
				if(timeInMillis){
				muteResult = await member.timeout(timeInMillis, `${reason || "unspecified"} | Case #${muteData.id}`).catch(err => err.message);
				} else {
				muteResult = await member.timeout(2419200000, `${reason || "unspecified"} | Case #${muteData.id}`).catch(err => err.message);
				}
				if (typeof muteResult === "string") {
					dm4.delete();
					return `Mute was unsuccessful: ${muteResult}`;
				} else {
					if (timeInMillis) {
						muteData.endTime = now + timeInMillis;
						muteData.duration = timeInMillis;
					}
					if (reason) muteData.reason = reason;
					client.makeModlogEntry(muteData, client);
					this.addData(muteData);
					this.forceSave();
					const embedm = new client.embed()
						.setTitle(`Case #${muteData.id}: Mute`)
						.setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`)
						.addFields(
							{name: 'Reason', value: `\`${reason || "unspecified"}\``},
							{name: 'Duration',
								value: `${client.formatTime(timeInMillis, 4, {
									longNames: true,
									commas: true
								})} (${timeInMillis}ms)`
							})
						.setColor(client.config.embedColor)
						if (moderator !== '795443537356521502') {return embedm};
				}
			case "warn":
				const warnData = { type, id: this.createId(), member: member.user.id, moderator, time: now };
				const warnResult = await member.send(`You've been warned in ${member.guild.name} for reason \`${reason || "unspecified"}\` (Case #${warnData.id})`).catch(err => setTimeout(() => interaction.channel.send(`Failed to DM <@${member.user.id}>.`), 500));
				if (typeof warnResult === "string") {
					return `Warn was unsuccessful: ${warnResult}`;
				} else {
					if (reason) warnData.reason = reason;
					client.makeModlogEntry(warnData, client);
					this.addData(warnData);
					this.forceSave();
					const embedw = new client.embed()
					.setTitle(`Case #${warnData.id}: Warn`)
					.setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`)
					.addFields({name: 'Reason', value: `\`${reason || "unspecified"}\``})
					.setColor(client.config.embedColor)
					if (moderator !== '795443537356521502') {return embedw};
				}
		}
	},
	async removePunishment(caseId, moderator, reason) {
		const now = Date.now();
		const punishment = this._content.find(x => x.id === caseId);
		const id = this.createId();
		if (!punishment) return "Punishment not found.";
		if (["ban", "mute"].includes(punishment.type)) {
			const guild = client.guilds.cache.get(client.config.mainServer.id);
			let removePunishmentResult;
			if (punishment.type === "ban") {
				// unban
				removePunishmentResult = await guild.members.unban(punishment.member, `${reason || "unspecified"} | Case #${id}`).catch(err => err.message); // unbanning returns a user
			} else if (punishment.type === "mute") {
				// remove role
				const member = await guild.members.fetch(punishment.member).catch(err => false);
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
					this._content[this._content.findIndex(x => x.id === punishment.id)].expired = true;
					this.addData(removePunishmentData).forceSave();
				}
			}
			if (typeof removePunishmentResult === "string") return `Un${punishment.type} was unsuccessful: ${removePunishmentResult}`;
			else {
				const removePunishmentData = { type: `un${punishment.type}`, id, cancels: punishment.id, member: punishment.member, reason, moderator, time: now };
				client.makeModlogEntry(removePunishmentData, client);
				this._content[this._content.findIndex(x => x.id === punishment.id)].expired = true;
				this.addData(removePunishmentData).forceSave();
				return `Successfully ${punishment.type === "ban" ? "unbanned" : "unmuted"} ${removePunishmentResult?.tag} (${removePunishmentResult?.id}) for reason \`${reason || "unspecified"}\``;
			}
		} else {
			try {
				const removePunishmentData = { type: "removeOtherPunishment", id, cancels: punishment.id, member: punishment.member, reason, moderator, time: now };
				client.makeModlogEntry(removePunishmentData, client);
				this._content[this._content.findIndex(x => x.id === punishment.id)].expired = true;
				this.addData(removePunishmentData).forceSave();
				return `Successfully removed Case #${punishment.id} (type: ${punishment.type}, user: ${punishment.member}).`;
			} catch (error) {
				return `${punishment.type[0].toUpperCase() + punishment.type.slice(1)} removal was unsuccessful: ${error.message}`;
			}
		}
	}
});

