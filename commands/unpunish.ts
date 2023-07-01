import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
import { hasRole, isDCStaff, youNeedRole } from '../utilities.js';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		if (!isDCStaff(interaction)) return youNeedRole(interaction, 'discordmoderator');

		const punishment = await client.punishments._content.findById(interaction.options.getInteger('caseid', true));
        const reason = interaction.options.getString("reason") ?? 'Unspecified';

		if (!punishment) return interaction.reply('No case found with that ID');
		if (punishment.expired) return interaction.reply('That case has already been overwritten');

		if (!['warn', 'mute'].includes(punishment.type) && hasRole(interaction, 'discordhelper')) return youNeedRole(interaction, 'discordmoderator');
		
		await client.punishments.removePunishment(punishment._id, interaction.user.id, reason, interaction);
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