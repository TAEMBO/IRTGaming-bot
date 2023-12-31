import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { punish } from '../../utils.js';
import { TInteraction } from '../../typings.js';

export default {
	async run(interaction: TInteraction) {
		await punish(interaction, this.data.name);
	},
	data: new SlashCommandBuilder()
		.setName("softban")
		.setDescription("Ban a member, delete their messages from the last day and unban them")
		.addUserOption(x => x
			.setName("member")
			.setDescription("The member to softban")
			.setRequired(true))
		.addStringOption(x => x
			.setName("reason")
			.setDescription("The reason for softbanning this member")
			.setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
};
