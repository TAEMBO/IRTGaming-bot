import Discord, { SlashCommandBuilder } from 'discord.js';
import { YClient } from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		if (!client.hasModPerms(interaction.member) && !client.config.devWhitelist.includes(interaction.member.id)) return client.youNeedRole(interaction, "mod");
		const word = interaction.options.getString("word");
		if (client.bannedWords._content.includes(word)) return interaction.reply('That word is already added.')
		client.bannedWords.addData(word).forceSave();
		interaction.reply(`Successfully added \`${word}\` to bannedWords list`);
	},
	data: new SlashCommandBuilder()
		.setName("addbannedword")
		.setDescription("Add a word to the bannedWords database")
		.addStringOption((opt)=>opt
			.setName("word")
			.setDescription("The word to add")
			.setRequired(true)
		)
};
