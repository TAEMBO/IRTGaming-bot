import { SlashCommandBuilder, EmbedBuilder, version } from 'discord.js';
import os from 'node:os';
import { TInteraction } from '../typings.js';
import { formatBytes, formatTime } from '../utilities.js';

export default {
	async run(interaction: TInteraction) {
		const colunms = ['Command Name', 'Uses'];
		const includedCommands = interaction.client.commands.filter(x => x.uses).sort((a, b) => b.uses - a.uses);

		if (!includedCommands.size) return interaction.reply(`No commands have been used yet.\nUptime: ${formatTime(interaction.client.uptime as number, 2, { commas: true, longNames: true })}`);
        
		const nameLength = Math.max(...includedCommands.map(x => x.data.name.length), colunms[0].length) + 2;
		const amountLength = Math.max(...includedCommands.map(x => x.uses.toString().length), colunms[1].length) + 1;
		const rows = [`${colunms[0] + ' '.repeat(nameLength - colunms[0].length)}|${' '.repeat(amountLength - colunms[1].length) + colunms[1]}\n`, '-'.repeat(nameLength) + '-'.repeat(amountLength) + '\n'];

        for (const [_, command] of includedCommands) {
            const name = command.data.name;
			const count = command.uses.toString();

			rows.push(`${name + '.'.repeat(nameLength - name.length)}${'.'.repeat(amountLength - count.length) + count}\n`);
        }

		const embed = new EmbedBuilder()
			.setTitle('Bot Statistics')
			.setDescription(`List of commands that have been used. Total amount of commands used since last restart: **${interaction.client.commands.map(x => x.uses).reduce((a, b) => a + b, 0)}**`)
			.setColor(interaction.client.config.embedColor);
            
		if (rows.join('').length > 1024) {
			let fieldValue = '';

            for (const row of rows) {
				if (fieldValue.length + row.length > 1024) {
					embed.addFields({ name: '\u200b', value: `\`\`\`\n${fieldValue}\`\`\`` });
					fieldValue = row;
				} else fieldValue += row;
            }

			embed.addFields({ name: '\u200b', value: `\`\`\`\n${fieldValue}\`\`\`` });
		} else embed.addFields({ name: '\u200b', value: `\`\`\`\n${rows.join('')}\`\`\`` });
		
		embed.addFields(
			{ name: 'Node.js', value: [
				`**RAM:** ${formatBytes(process.memoryUsage().heapUsed, 2, 1000)}**/**${formatBytes(os.freemem(), 2, 1000)}`,
				`**Version:** ${process.version}`,
				`**Discord.js version:** v${version}`,
				`**Uptime:** ${formatTime(interaction.client.uptime as number, 2, { commas: true, longNames: true })}`
			].join('\n') },
			{ name: 'System', value: [
				`**CPU:** ${os.cpus()[0].model.trim()}`,
				`**RAM:** ${formatBytes(os.totalmem(), 2, 1000)}`,
				`**Uptime:** ${formatTime((os.uptime() * 1000), 2, { commas: true, longNames: true })}`
			].join('\n') }
		);
		interaction.reply({ embeds: [embed] });
	},
	data: new SlashCommandBuilder()
		.setName("statistics")
		.setDescription("See statistics for the bot itself")
};
