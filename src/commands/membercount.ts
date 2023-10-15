import { SlashCommandBuilder } from 'discord.js';
import { TInteraction } from '../typings.js';

export default {
	async run(interaction: TInteraction) {
		await interaction.reply(`**${interaction.guild.name}** has **${interaction.guild.memberCount.toLocaleString()}** members.`);
	},
	data: new SlashCommandBuilder()
		.setName("membercount")
		.setDescription("View the guilds member count!")
};