import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
import util from 'node:util';
import fs from 'node:fs';
import { exec } from 'child_process';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		if (!client.config.devWhitelist.includes(interaction.user.id)) return interaction.reply(`You're not allowed to use dev commands.`);
		({
			eval: async () => {
				const code = interaction.options.getString("code", true);
				const useAsync = Boolean(interaction.options.getBoolean("async", false));
				let output = 'error';
				
				try {
					output = await eval(useAsync ? `(async () => { ${code} })()` : code);
				} catch (err: any) {
					const embed = new client.embed()
						.setTitle('__Eval__')
						.setColor("#ff0000")
						.addFields(
							{ name: 'Input', value: `\`\`\`js\n${code.slice(0, 1010)}\n\`\`\``},
							{ name: 'Output', value: `\`\`\`\n${err}\n\`\`\`` });
					interaction.reply({embeds: [embed]}).catch(() => (interaction.channel as Discord.TextChannel).send({embeds: [embed]})).then(x => {
						const filter = (x: any) => x.content === 'stack' && x.author.id === interaction.user.id;
						const messagecollector = (interaction.channel as Discord.TextChannel).createMessageCollector({ filter, max: 1, time: 60000 });
						messagecollector?.on('collect', msg => { msg.reply({content: `\`\`\`\n${err.stack}\n\`\`\``, allowedMentions: { repliedUser: false }}) });
					});
					return;
				}
				if (typeof output === 'object') {
					output = 'js\n' + util.formatWithOptions({ depth: 1 }, '%O', output);
				} else output = '\n' + String(output);
				
				[client.token, client.tokens.fs.ps.login, client.tokens.fs.pg.login, client.tokens.fs.mf.login, client.tokens.ftp.ps.password, client.tokens.ftp.pg.password].forEach(login => {
					output = output.replace(login as string, 'LOGIN_LEAK');
				});
				const embed = new client.embed()
					.setTitle('__Eval__')
					.setColor(client.config.embedColor)
					.addFields(
						{ name: 'Input', value: `\`\`\`js\n${code.slice(0, 1010)}\n\`\`\`` },
						{ name: 'Output', value: `\`\`\`${output.slice(0, 1016)}\n\`\`\`` });
				interaction.reply({embeds: [embed]}).catch(() => (interaction.channel as Discord.TextChannel).send({embeds: [embed]}));
			},
			role: () => {
				const role = interaction.options.getRole("role", true);
				const member = interaction.options.getMember("member") as Discord.GuildMember;

				if (member.roles.cache.has(role.id)) {
					member.roles.remove(role.id).then(() => interaction.reply('Role removed')).catch((e: Error) => interaction.reply(e.message));
				} else member.roles.add(role.id).then(() => interaction.reply('Role added')).catch((e: Error) => interaction.reply(e.message));
			},
			file: () => interaction.reply({files: [`./databases/${interaction.options.getString('file', true)}.json`]}).catch((e: Error) => (interaction.channel as Discord.TextChannel).send(e.message)),
			statsgraph: () => {
				client.config.statsGraphSize = -(interaction.options.getInteger('number', true));
				interaction.reply(`Set to \`${client.config.statsGraphSize}\``);
			},
			restart: () => interaction.reply("Restarting...").then(() => exec('pm2 restart IRTBot')),
			update: () => interaction.reply({content: "Pulling from repo...", fetchReply: true}).then(msg => exec('git pull', (error, stdout) => {
				if (error) {
					msg.edit(`Pull failed:\n\`\`\`${error.message}\`\`\``);
				} else if (stdout.includes('Already up to date')) {
					msg.edit(`Pull aborted:\nUp-to-date`);
				} else setTimeout(() => msg.edit('Restarting...').then(() => exec('pm2 restart IRTBot')), 2500);
			})),
			increment: async () => {
				const data: Array<Array<number>> = JSON.parse(fs.readFileSync('./databases/dailyMsgs.json', 'utf8'));
				const member = interaction.options.getMember('member') as Discord.GuildMember;
				const newTotal = interaction.options.getInteger('total', true);
				const oldData = await client.userLevels._content.findById(member.id);
				if (!oldData) return interaction.reply('No data found');
				if (newTotal < oldData.messages) return interaction.reply('New total is smaller than old total');
				const newData: Array<Array<number>> = [];

				await client.userLevels._content.findByIdAndUpdate(member.id, { messages: newTotal });
				data.forEach(x => newData.push([x[0], (x[1] + (newTotal - oldData.messages))]));
				fs.writeFileSync('./databases/dailyMsgs.json', JSON.stringify(newData, null, 4));
				interaction.reply(`<@${member.id}>'s new total set to \`${newTotal}\``);
			},
			logs: () => interaction.reply({files: [`../../.pm2/logs/IRTBot-${interaction.options.getString('logtype', true)}-0.log`]}).catch((err: Error) => (interaction.channel as Discord.TextChannel).send(err.message)),
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
		.addSubcommand(x=>x
			.setName('eval')
			.setDescription('Execute code within the bot')
			.addStringOption(x=>x
				.setName("code")
				.setDescription("The code to execute")
				.setRequired(true))
			.addBooleanOption(x=>x
				.setName('async')
				.setDescription('Whether to wrap the code in an async block or not')))
		.addSubcommand(x=>x
			.setName('restart')
			.setDescription('Restart the bot'))
		.addSubcommand(x=>x
			.setName('update')
			.setDescription('Pull from GitHub repository to live bot'))
		.addSubcommand(x=>x
			.setName('role')
			.setDescription('Give or take roles')
			.addUserOption(x=>x
				.setName("member")
				.setDescription("The member to manage")
				.setRequired(true))
			.addRoleOption(x=>x
				.setName("role")
				.setDescription("The role to give or take")
				.setRequired(true)))
		.addSubcommand(x=>x
			.setName('file')
			.setDescription('Send a db file')
			.addStringOption(x=>x
				.setName("file")
				.setDescription("The name of the file")
				.setRequired(true)))
		.addSubcommand(x=>x
			.setName('statsgraph')
			.setDescription('Edit the number of data points pulled')
			.addIntegerOption(x=>x
				.setName("number")
				.setDescription("The number of data points to pull")
				.setRequired(true)))
		.addSubcommand(x=>x
			.setName('increment')
			.setDescription('Increment ranking stats')
			.addUserOption(x=>x
				.setName("member")
				.setDescription("The member to increment")
				.setRequired(true))
			.addIntegerOption(x=>x
				.setName("total")
				.setDescription("Their new message total")
				.setRequired(true)))
		.addSubcommand(x=>x
			.setName('logs')
			.setDescription('Retrieve output log')
			.addStringOption(x=>x
				.setName('logtype')
				.setDescription('The type of PM2 log to send')
				.addChoices(
					{ name: 'Log', value: 'log' },
					{ name: 'Error', value: 'error' })))
		.addSubcommand(x=>x
			.setName('dz')
			.setDescription('Wheezing Over Life'))
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
				)))
};
