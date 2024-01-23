import { type ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { punish } from "../../utils.js";

export default {
	async run(interaction: ChatInputCommandInteraction<"cached">) {
		await punish(interaction, this.data.name);
	},
	data: new SlashCommandBuilder()
		.setName("kick")
		.setDescription("Kick a member")
		.addUserOption(x => x
			.setName("member")
			.setDescription("The member to kick")
			.setRequired(true))
		.addStringOption(x => x
			.setName("reason")
			.setDescription("The reason for kicking the member")
			.setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
};
