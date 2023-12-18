import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { punish } from '../../utilities.js';
import { TInteraction } from '../../typings.js';

export default {
	async run(interaction: TInteraction) {
		await punish(interaction, this.data.name);
	},
    data: new SlashCommandBuilder()
		.setName("ban")
		.setDescription("Ban a member")
		.addUserOption(x => x
			.setName("member")
			.setDescription("The member to ban")
			.setRequired(true))
		.addStringOption(x => x
			.setName("time")
			.setDescription("The time for the ban")
			.setRequired(false))
		.addStringOption(x => x
			.setName("reason")
			.setDescription("The reason for banning the member")
			.setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
};
