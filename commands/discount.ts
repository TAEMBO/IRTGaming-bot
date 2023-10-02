import { SlashCommandBuilder } from 'discord.js';
import { TInteraction } from '../typings.js';
import { isDCStaff, youNeedRole } from '../utilities.js';

export default {
	async run(interaction: TInteraction) {
		if (!isDCStaff(interaction)) return await youNeedRole(interaction, 'discordmoderator');

        const member = interaction.options.getMember('member');

        if (!member) return await interaction.reply({ content: 'You need to select a member that is in this server', ephemeral: true });

        await interaction.client.getChan('counting').permissionOverwrites.edit(member.user.id, { SendMessages: false });
        await interaction.reply(`<@${member.user.id}>'s perm to send messages in <#${interaction.client.config.mainServer.channels.counting}> has been removed`);
	},
	data: new SlashCommandBuilder()
		.setName("discount")
		.setDescription("Remove someone's ability to count in #counting")
		.addUserOption(x => x
			.setName("member")
			.setDescription("The member to give a 15% discount to")
			.setRequired(true))
};
