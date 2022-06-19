const { SlashCommandBuilder, Faces } = require("@discordjs/builders");

module.exports = {
	run: (client, interaction) => {
		if (!client.hasModPerms(client, interaction.member)) return interaction.reply({content: `You need the <@&${client.config.mainServer.roles.mod}> role to use this command.`, allowedMentions: {roles: false}});
		const word = interaction.options.getString("word")
		if (client.bannedWords._content.includes(word)) return interaction.reply('That term is already added.')
		client.bannedWords.addData(word).forceSave();
		interaction.reply({content: `Successfully added \`${word}\` to bannedWords list`, allowedMentions: { repliedUser: false }});
	},
	data: new SlashCommandBuilder().setName("addbannedword").setDescription("Add a word to the bannedWords database").addStringOption((opt)=>opt.setName("word").setDescription("The word you would like to add to the bannedWords database!").setRequired(true))
};
