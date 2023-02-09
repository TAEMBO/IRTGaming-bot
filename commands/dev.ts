import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
import util from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'child_process';
const removeUsername = (text: string) => {
	let matchesLeft = true;
	const array = text.split('\\');
	while (matchesLeft) {
		let usersIndex = array.indexOf('Users');
		if (usersIndex < 1) matchesLeft = false;
		else {
			let usernameIndex = usersIndex + 1;
			if (array[usernameIndex].length === 0) usernameIndex += 1;
			array[usernameIndex] = '#'.repeat(array[usernameIndex].length);
			array[usersIndex] = 'Us\u200bers';
		}
	}
	return array.join('\\');
};

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		if (!client.config.devWhitelist.includes(interaction.user.id)) return interaction.reply(`You're not allowed to use dev commands.`);
		({
			eval: async () => {
				const code = interaction.options.getString("code", true);
				let output = 'error';
				let error = false;
				try {
					output = await eval(code);
				} catch (err: any) {
					error = true;
					const embed = new client.embed()
						.setTitle('__Eval__')
						.addFields({name: 'Input', value: `\`\`\`js\n${code.slice(0, 1010)}\n\`\`\``}, {name: 'Output', value: `\`\`\`\n${err}\n\`\`\``})
						.setColor("#ff0000");
					interaction.reply({embeds: [embed]}).catch(() => (interaction.channel as Discord.TextChannel).send({embeds: [embed]})).then(errorEmbedMessage => {
						const filter = (x: any) => x.content === 'stack' && x.author.id === interaction.user.id
						const messagecollector = (interaction.channel as Discord.TextChannel).createMessageCollector({ filter, max: 1, time: 60000 });
						messagecollector.on('collect', collected => {
							collected.reply({content: `\`\`\`\n${removeUsername(err.stack)}\n\`\`\``, allowedMentions: { repliedUser: false }});
						});
					});
				}
				if (error) return;
				if (typeof output === 'object') {
					output = 'js\n' + util.formatWithOptions({ depth: 1 }, '%O', output);
				} else {
					output = '\n' + String(output);
				}
				[client.token, client.tokens.fs.ps.login, client.tokens.fs.pg.login, client.tokens.fs.mf.login, client.tokens.ftp.ps.password, client.tokens.ftp.pg.password].forEach((login) => {
					output = output.replace(login as string, 'LOGIN_LEAK');
				});
				const embed = new client.embed()
					.setTitle('__Eval__')
					.addFields({name: 'Input', value:`\`\`\`js\n${code.slice(0, 1010)}\n\`\`\``}, {name: 'Output', value: `\`\`\`${removeUsername(output).slice(0, 1016)}\n\`\`\``})
					.setColor(client.config.embedColor);
				interaction.reply({embeds: [embed]}).catch(() => (interaction.channel as Discord.TextChannel).send({embeds: [embed]}));
			},
			role: () => {
				const role = interaction.options.getRole("role") as Discord.Role;
				const member = interaction.options.getMember("member") as Discord.GuildMember;
				let err = false;

				if (member.roles.cache.has(role.id)) {
					member.roles.remove(role.id).catch((e) => {interaction.reply(e.message); err = true}).then(()=> {if (!err) interaction.reply('Role removed');});
				} else {
					member.roles.add(role.id).catch((e) => {interaction.reply(e.message); err = true}).then(()=> {if (!err) interaction.reply('Role added');});
				}
			},
			file: () => interaction.reply({files: [`./databases/${interaction.options.getString('file', true)}.json`]}).catch((e: Error) => interaction.channel?.send(removeUsername(e.message))),
			statsgraph: () => {
				client.FSCache.statsGraph = -(interaction.options.getInteger('number', true));
				interaction.reply(`Set to \`${client.FSCache.statsGraph}\``);
			},
			decrement: () => {
				const player = interaction.options.getString('player', true);
				const time = interaction.options.getInteger('time', true);
				client.playerTimes.decrement(player, time).forceSave();
				interaction.reply(`Decremented \`${time}\` min from \`${player}\``);
			},
			restart: () => {
				client.userLevels.forceSave();
				client.playerTimes.forceSave();
				interaction.reply("Restarting...").then(async ()=> exec('pm2 restart IRTBot'));
			},
			update: async () => {
				const msg = await interaction.reply({content: "Pulling from repo...", fetchReply: true});
				client.userLevels.forceSave();
				client.playerTimes.forceSave();
				exec('git pull', (error, stdout) => {
					if (error) {
						msg.edit(`Pull failed:\n\`\`\`${error.message}\`\`\``);
					} else if (stdout.includes('Already up to date')) {
						msg.edit(`Pull aborted:\nUp-to-date`);
					} else {
						setTimeout(() => msg.edit('Restarting...').then(() => exec('pm2 restart IRTBot')), 2500);
					}
				});
			},
			increment: () => {
				const dailyMsgsPath = path.join(__dirname, '../databases/dailyMsgs.json');
				const data = JSON.parse(fs.readFileSync(dailyMsgsPath, {encoding: 'utf8'}));
				const member1 = interaction.options.getMember('member') as Discord.GuildMember;
				const newTotal = interaction.options.getInteger('total', true);
				const oldTotal = client.userLevels._content[member1.id].messages;
				if (newTotal < oldTotal) return interaction.reply('New total is smaller than old total');
				const newData: Array<Array<number>> = [];

				client.userLevels._content[member1.id].messages = newTotal;
				data.forEach((x: Array<number>) => newData.push([x[0], (x[1] + (newTotal - oldTotal))]));
				fs.writeFileSync(dailyMsgsPath, JSON.stringify(newData));
				interaction.reply(`<@${member1.id}>'s new total set to \`${newTotal}\``);
			},
			logs: () => interaction.reply({files: ['../../.pm2/logs/IRTBot-out-0.log']}).catch((err: Error) => interaction.channel?.send(removeUsername(err.message))),
			dz: () => interaction.reply('PC has committed iWoke:tm:').then(() => exec('start C:/WakeOnLAN/WakeOnLanC.exe -w -m Desktop')),
			presence: () => {
				function convertType(Type?: number) {
					return {
						0: 'Playing',
						2: 'Listening',
						3: 'Watching',
						5: 'Competing',
						default: undefined
					}[Type || 'default'];
				}
				const status = interaction.options.getString('status') as Discord.PresenceStatusData | null;
				const type = interaction.options.getInteger('type');
				const name = interaction.options.getString('name');
				const currentActivities = client.config.botPresence.activities as Discord.ActivitiesOptions[];

				if (status) client.config.botPresence.status = status;
				if (type) currentActivities[0].type = type;
				if (name) currentActivities[0].name = name;

				client.user?.setPresence(client.config.botPresence);

				interaction.reply([
					'Presence updated:',
					`Status: **${client.config.botPresence.status}**`,
					`Type: **${convertType(currentActivities[0].type)}**`,
					`Name: **${currentActivities[0].name}**`
				].join('\n'));
			}
		} as any)[interaction.options.getSubcommand()]();
	},
	data: new SlashCommandBuilder()
		.setName("dev")
		.setDescription("Run bot-dev-only commands")
		.addSubcommand((optt)=>optt
			.setName('eval')
			.setDescription('Execute code within the bot')
			.addStringOption((opt)=>opt
				.setName("code")
				.setDescription("The code to execute")
				.setRequired(true))
		)
		.addSubcommand((optt)=>optt
			.setName('restart')
			.setDescription('Restart the bot')
		)
		.addSubcommand((optt)=>optt
			.setName('update')
			.setDescription('Pull from GitHub repository to live bot')
		)
		.addSubcommand((optt)=>optt
			.setName('role')
			.setDescription('Give or take roles')
			.addUserOption((opt)=>opt
				.setName("member")
				.setDescription("The member to manage")
				.setRequired(true))
			.addRoleOption((opt)=>opt
				.setName("role")
				.setDescription("The role to give or take")
				.setRequired(true))
		)
		.addSubcommand((optt)=>optt
			.setName('file')
			.setDescription('Send a db file')
			.addStringOption((opt)=>opt
				.setName("file")
				.setDescription("The name of the file")
				.setRequired(true))
		)
		.addSubcommand((optt)=>optt
			.setName('statsgraph')
			.setDescription('Edit the number of data points pulled')
			.addIntegerOption((opt)=>opt
				.setName("number")
				.setDescription("The number of data points to pull")
				.setRequired(true))
		)
		.addSubcommand((optt)=>optt
			.setName('decrement')
			.setDescription('Decrement playerTimes data')
			.addStringOption((opt)=>opt
				.setName("player")
				.setDescription("Player's name")
				.setRequired(true))
			.addIntegerOption((opt)=>opt
				.setName("time")
				.setDescription("The minutes to decrement")
				.setRequired(true))
		)
		.addSubcommand((optt)=>optt
			.setName('increment')
			.setDescription('Increment ranking stats')
			.addUserOption((opt)=>opt
				.setName("member")
				.setDescription("The member to increment")
				.setRequired(true))
			.addIntegerOption((opt)=>opt
				.setName("total")
				.setDescription("Their new message total")
				.setRequired(true))
		)
		.addSubcommand((optt)=>optt
			.setName('logs')
			.setDescription('Retrieve output log')
		)
		.addSubcommand(x=>x
			.setName('dz')
			.setDescription('Wheezing Over Life')
		)
		.addSubcommand(x=>x
			.setName('presence')
			.setDescription('Update the bot\'s presence')
			.addIntegerOption(x=>x
				.setName('type')
				.setDescription('The activity type to set')
				.addChoices(
					{name: 'Playing', value: Discord.ActivityType.Playing},
					{name: 'Listening', value: Discord.ActivityType.Listening},
					{name: 'Watching', value: Discord.ActivityType.Watching},
					{name: 'Competing', value: Discord.ActivityType.Competing}
				))
			.addStringOption(x=>x
				.setName('name')
				.setDescription('The activity name to set'))
			.addStringOption(x=>x
				.setName('status')
				.setDescription('The status to set')
				.addChoices(
					{name: 'Online', value: Discord.PresenceUpdateStatus.Online},
					{name: 'Idle', value: Discord.PresenceUpdateStatus.Idle},
					{name: 'DND', value: Discord.PresenceUpdateStatus.DoNotDisturb},
					{name: 'Invisible', value: Discord.PresenceUpdateStatus.Invisible}
				))
		)
};
