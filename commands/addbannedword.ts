import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		if (!client.isDCStaff(interaction.member) && !client.config.devWhitelist.includes(interaction.member.id)) return client.youNeedRole(interaction, 'discordmoderator');
		const word = interaction.options.getString("word", true);

		if (!client.bannedWords._content.includes(word)) {
			client.bannedWords.add(word);
			interaction.reply(`Successfully added to bannedWords list`);
		} else interaction.reply('That word is already added');
	},
	data: new SlashCommandBuilder()
		.setName("addbannedword")
		.setDescription("Add a word to the bannedWords database")
		.addStringOption(x=>x
			.setName("word")
			.setDescription("The word to add")
			.setRequired(true)
		)
};
