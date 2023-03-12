import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		if (!client.hasModPerms(interaction.member)) return client.youNeedRole(interaction, "mod");

		const punishment = (await client.punishments._content.find()).find(x => x._id === interaction.options.getInteger("case_id", true));
		if (!punishment) return interaction.reply('That isn\'t a valid case ID');
		if (punishment.expired) return interaction.reply('That case has already been overwritten');
		if (['warn', 'mute'].includes(punishment.type) && interaction.member.roles.cache.has(client.config.mainServer.roles.helper)) return client.youNeedRole(interaction, "mod");
		const reason = interaction.options.getString("reason") ?? 'Unspecified';
		
		await client.punishments.removePunishment(punishment.id, interaction.user.id, reason, interaction);
	},
	data: new SlashCommandBuilder()
		.setName("unpunish")
		.setDescription("Unpunish a member")
		.addIntegerOption((opt) => opt
			.setName("case_id")
			.setDescription("The ID of the punishment to remove")
			.setRequired(true))
		.addStringOption((opt)=>opt
			.setName("reason")
			.setDescription("The reason for removing the punishment")
			.setRequired(false))
};