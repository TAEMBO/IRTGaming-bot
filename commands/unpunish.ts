import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		if (!client.isDCStaff(interaction.member)) return client.youNeedRole(interaction, 'discordmoderator');

		const punishment = await client.punishments._content.findById(interaction.options.getInteger('caseid', true));
		if (!punishment) return interaction.reply('No case found with that ID');
		if (punishment.expired) return interaction.reply('That case has already been overwritten');
		if (!['warn', 'mute'].includes(punishment.type) && interaction.member.roles.cache.has(client.config.mainServer.roles.discordhelper)) return client.youNeedRole(interaction, 'discordmoderator');
		const reason = interaction.options.getString("reason") ?? 'Unspecified';
		
		await client.punishments.removePunishment(punishment.id, interaction.user.id, reason, interaction);
	},
	data: new SlashCommandBuilder()
		.setName("unpunish")
		.setDescription("Unpunish a member")
		.addIntegerOption(x=>x
			.setName("caseid")
			.setDescription("The ID of the punishment to overwrite")
			.setRequired(true))
		.addStringOption(x=>x
			.setName("reason")
			.setDescription("The reason for overwriting the punishment")
			.setRequired(false))
};