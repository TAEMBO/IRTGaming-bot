import Discord, { SlashCommandBuilder, version } from 'discord.js';
import YClient from '../client';
import os from 'node:os';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		const colunms = ['Command Name', 'Count'];
		const includedCommands = client.commands.filter(x => x.uses).sort((a, b) => b.uses - a.uses);
		if (includedCommands.size === 0) return interaction.reply(`No commands have been used yet.\nUptime: ${client.formatTime(client.uptime as number, 2, { commas: true, longNames: true })}`); 
		const nameLength = Math.max(...includedCommands.map(x => x.default.data.name.length), colunms[0].length) + 2;
		const amountLength = Math.max(...includedCommands.map(x => x.uses.toString().length), colunms[1].length) + 1;
		const rows = [`${colunms[0] + ' '.repeat(nameLength - colunms[0].length)}|${' '.repeat(amountLength - colunms[1].length) + colunms[1]}\n`, '-'.repeat(nameLength) + '-'.repeat(amountLength) + '\n'];
		includedCommands.forEach(command => {
			const name = command.default.data.name;
			const count = command.uses.toString();
			rows.push(`${name + '.'.repeat(nameLength - name.length)}${'.'.repeat(amountLength - count.length) + count}\n`);
		});
		const embed = new client.embed()
			.setTitle('Statistics: Command Usage')
			.setDescription(`List of commands that have been used in this session, ordered by amount of uses. Table contains command name and amount of uses.\nTotal amount of commands used in this session: ${client.commands.filter(x => x.uses).map(x => x.uses).reduce((a, b) => a + b, 0)}`)
			.setColor(client.config.embedColor)
		if (rows.join('').length > 1024) {
			let fieldValue = '';
			rows.forEach(row => {
				if (fieldValue.length + row.length > 1024) {
					embed.addFields({name: '\u200b', value: `\`\`\`\n${fieldValue}\`\`\``});
					fieldValue = row;
				} else fieldValue += row;
			});
			embed.addFields({name: '\u200b', value: `\`\`\`\n${fieldValue}\`\`\``});
		} else embed.addFields({name: '\u200b', value: `\`\`\`\n${rows.join('')}\`\`\``});
		
		embed.addFields(
			{name: 'Node.js', value: [
				`**RAM:** ${client.formatBytes(process.memoryUsage().heapTotal, 2, 1000)}**/**${client.formatBytes(os.freemem(), 2, 1024)}`,
				`**Version:** ${process.version}`,
				`**Discord.js version:** v${version}`,
				`**Uptime:** ${client.formatTime(client.uptime as number, 2, { commas: true, longNames: true })}`
			].join('\n')},
			{name: 'System', value: [
				`**CPU:** ${os.cpus()[0].model.trim()}`,
				`**RAM:** ${client.formatBytes(os.totalmem(), 2, 1024)}`,
				`**Uptime:** ${client.formatTime((os.uptime() *1000), 2, { commas: true, longNames: true })}`
			].join('\n')}
		)
		interaction.reply({embeds: [embed], fetchReply: true}).then((msg) => msg.edit({embeds: [new client.embed(msg.embeds[0].data).setFooter({text: `Load time: ${msg.createdTimestamp - interaction.createdTimestamp}ms`})]}));
	},
	data: new SlashCommandBuilder()
		.setName("statistics")
		.setDescription("See command stats or host stats")
};
