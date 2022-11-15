const {SlashCommandBuilder} = require('discord.js');
const util = require('util');
const fs = require('node:fs')
const removeUsername = (text) => {
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
module.exports = {
	run: async (client, interaction) => {
		if (!client.config.devWhitelist.includes(interaction.user.id)) return interaction.reply(`You're not allowed to use dev commands.`);
		const subCmd = interaction.options.getSubcommand();

		switch (subCmd) {
			case 'eval':
				const code = interaction.options.getString("code")
				let output = 'error';
				let error = false;
				try {
					output = await eval(code);
				} catch (err) {
					error = true;
					const embed = new client.embed()
						.setTitle('__Eval__')
						.addFields({name: 'Input', value: `\`\`\`js\n${code.slice(0, 1010)}\n\`\`\``}, {name: 'Output', value: `\`\`\`\n${err}\n\`\`\``})
						.setColor('ff0000');
					interaction.reply({embeds: [embed]}).catch((e)=>interaction.channel.send({embeds: [embed]})).then(errorEmbedMessage => {
						const filter = x => x.content === 'stack' && x.author.id === interaction.user.id
						const messagecollector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });
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
				const regexp = new RegExp(client.token, 'g');
				output = output.replace(regexp, 'TOKEN_LEAK');
				const embed = new client.embed()
					.setTitle('__Eval__')
					.addFields({name: 'Input', value:`\`\`\`js\n${code.slice(0, 1010)}\n\`\`\``}, {name: 'Output', value: `\`\`\`${removeUsername(output).slice(0, 1016)}\n\`\`\``})
					.setColor(client.config.embedColor);
				interaction.reply({embeds: [embed]}).catch((e)=>interaction.channel.send({embeds: [embed]}));
				break;
			case 'role':
				const role = interaction.options.getRole("role");
				const member0 = interaction.options.getMember("member");
				let err = false;

				if (member.roles.cache.has(role.id)) {
					member.roles.remove(role.id).catch((e) => {interaction.reply(e.message); err = true}).then(()=> {if (!err) interaction.reply('Role removed');});
				} else {
					member.roles.add(role.id).catch((e) => {interaction.reply(e.message); err = true}).then(()=> {if (!err) interaction.reply('Role added');});
				}
				break;
			case 'file':
				const file = interaction.options.getString('file');
				interaction.reply({files: [`./databases/${file}.json`]}).catch((e) => interaction.reply(`\`${removeUsername(e.message)}\``))
				break;
			case 'statsgraph':
				client.FSCache.statsGraph = -interaction.options.getInteger('number');
				interaction.reply(`Set to \`${client.FSCache.statsGraph}\``);
				break;
			case 'decrement':
				const player = interaction.options.getString('player');
				const time = interaction.options.getInteger('time');
				client.playerTimes.decrement(player, time).forceSave();
				interaction.reply(`Decremented \`${time}\` min from \`${player}\``)
				break;
			case 'restart':
				interaction.reply("Restarting...").then(async ()=> eval(process.exit(-1)))
				break;
			case 'update':
				const msg = await interaction.reply({content: "Pulling from repo...", fetchReply: true});
				require("child_process").exec("git pull");
				setTimeout(()=> {msg.edit({content: 'Restarting...'}).then(()=> eval(process.exit(-1)))}, 1000)
				break;
			case 'increment':
				const data = require('../databases/dailyMsgs.json');
				const member1 = interaction.options.getMember('member');
				const newTotal = interaction.options.getInteger('total');
				const oldTotal = client.userLevels._content[member1.id].messages;
				const newData = [];

				client.userLevels._content[member1.id].messages = newTotal;
				data.forEach((x) => newData.push([x[0], (x[1] + (newTotal - oldTotal))]));
				fs.writeFileSync(require('node:path').join(__dirname, '../databases/dailyMsgs.json'), JSON.stringify(newData));
				interaction.reply(`\`${member1.id}\` set to \`${total}\``)
				break;
		}
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
};
