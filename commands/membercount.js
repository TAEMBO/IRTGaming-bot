const {SlashCommandBuilder} = require('discord.js');

module.exports = {
	run: async (client, interaction) => {
		interaction.reply(`**${interaction.guild.name}** has **${interaction.guild.memberCount.toLocaleString()}** members.`);
	},
	data: new SlashCommandBuilder()
		.setName("membercount")
		.setDescription("View the guilds member count!")
};