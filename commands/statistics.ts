import Discord, { SlashCommandBuilder, version } from 'discord.js';
import YClient from '../client';
import si from 'systeminformation';
import os from 'node:os';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		await interaction.deferReply();
		const cpu = await si.cpu();
		const ram = await si.mem();
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
				} else {
					fieldValue += row
				}
			});
			embed.addFields({name: '\u200b', value: `\`\`\`\n${fieldValue}\`\`\``});
		} else {
			embed.addFields({name: '\u200b', value: `\`\`\`\n${rows.join('')}\`\`\``});
		}
		embed.addFields({name: 'Statistics: Host info', value: `> __**Node.js**__\n**RAM:** ${(Math.round (process.memoryUsage().heapTotal / 1000)) / 1000}MB**/**${(Math.round(ram.available / 1000000)) / 1000}GB\n**Version:** ${process.version}\n**Discord.js version:** v${version}\n**Uptime:** ${client.formatTime(client.uptime as number, 2, { commas: true, longNames: true })}\n> __**System**__\n**CPU:** ${cpu.manufacturer} ${cpu.brand}\n**RAM:** ${Math.floor(ram.total / 1024 / 1000000)}GB\n**Uptime:** ${client.formatTime((os.uptime() *1000), 2, { commas: true, longNames: true })}`})
		embed.setFooter({text: `Load time: ${Date.now() - interaction.createdTimestamp}ms`})
		interaction.editReply({embeds: [embed]})
	},
	data: new SlashCommandBuilder()
		.setName("statistics")
		.setDescription("See command stats or host stats")
};
