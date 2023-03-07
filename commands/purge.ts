import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		if (interaction.channel?.type === Discord.ChannelType.GuildStageVoice) return;
		if (!client.hasModPerms(interaction.member)) return client.youNeedRole(interaction, "mod");

		const amount = interaction.options.getInteger("amount", true);
		if (amount > 100) return interaction.reply({content: 'Discord\'s API limits purging up to 100 messages.', ephemeral: true});
		
		const user = interaction.options.getUser("user");

		interaction.channel?.messages.fetch({ limit: amount }).then(async msgs => {
			if (interaction.channel?.type === Discord.ChannelType.GuildStageVoice) return;
			if (user) {
				await interaction.channel?.bulkDelete(msgs.filter(x => x.author.id === user.id));
			} else await interaction.channel?.bulkDelete(msgs);
			interaction.reply({content: `Successfully deleted ${user ? msgs.filter(x => x.author.id === user.id).size + ` messages from <@${user.id}>` : amount + ' messages'}.`, ephemeral: true});
		});
	},
	data: new SlashCommandBuilder()
		.setName("purge")
		.setDescription("Purges messages in a channel.")
		.addIntegerOption((opt)=>opt
			.setName("amount")
			.setDescription("The amount of messages to purge.")
			.setRequired(true))
		.addUserOption((opt)=>opt
			.setName("user")
			.setDescription("The user to purge messages from.")
			.setRequired(false))
};
