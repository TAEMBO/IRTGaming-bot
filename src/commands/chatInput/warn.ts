import { PermissionFlagsBits, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { punish } from '../../utils.js';

export default {
	async run(interaction: ChatInputCommandInteraction<"cached">) {
		await punish(interaction, this.data.name);
	},
	data: new SlashCommandBuilder()
		.setName("warn")
		.setDescription("Warn a member")
		.addUserOption(x => x
			.setName("member")
			.setDescription("The member to warn")
			.setRequired(true))
		.addStringOption(x => x
			.setName("reason")
			.setDescription("The reason for warning the member")
			.setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
};
