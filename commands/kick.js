const {SlashCommandBuilder} = require('discord.js')
module.exports = {
	run: (client, interaction) => {
		client.punish(client, interaction, 'kick');
	},
	data: new SlashCommandBuilder()
		.setName("kick")
		.setDescription("Kick a member")
		.addUserOption((opt)=>opt
			.setName("member")
			.setDescription("The member to kick")
			.setRequired(true))
		.addStringOption((opt)=>opt
			.setName("reason")
			.setDescription("The reason for kicking the member")
			.setRequired(false))
};
