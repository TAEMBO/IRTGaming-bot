const {SlashCommandBuilder} = require("@discordjs/builders")
module.exports = {
	run: (client, interaction) => {
		client.punish(client, interaction, 'kick');
	},
	data: new SlashCommandBuilder()
		.setName("kick")
		.setDescription("Kicks a user from the server.")
		.addUserOption((opt)=>opt
			.setName("member")
			.setDescription("The user to kick from the server.")
			.setRequired(true))
			.addStringOption((opt)=>opt
				.setName("reason")
				.setDescription("The reason for kicking the user.")
				.setRequired(false))
};
