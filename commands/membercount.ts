import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		interaction.reply(`**${interaction.guild.name}** has **${interaction.guild.memberCount.toLocaleString()}** members.`);
	},
	data: new SlashCommandBuilder()
		.setName("membercount")
		.setDescription("View the guilds member count!")
};