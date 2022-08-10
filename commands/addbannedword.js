const {SlashCommandBuilder} = require('discord.js');

module.exports = {
	run: (client, interaction) => {
		if (!client.hasModPerms(client, interaction.member) && interaction.user.id !== '615761944154210305') return interaction.reply({content: client.yOuNeEdMoD, allowedMentions: {roles: false}});
		const word = interaction.options.getString("word")
		if (client.bannedWords._content.includes(word)) return interaction.reply('That word is already added.')
		client.bannedWords.addData(word).forceSave();
		interaction.reply(`Successfully added \`${word}\` to bannedWords list`);
	},
	data: new SlashCommandBuilder()
		.setName("addbannedword")
		.setDescription("Add a word to the bannedWords database")
		.addStringOption((opt)=>opt
			.setName("word")
			.setDescription("The word you would like to add to the bannedWords database!")
			.setRequired(true)
		)
};
