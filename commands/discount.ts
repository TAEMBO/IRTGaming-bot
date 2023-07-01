import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
import { getChan, isDCStaff, youNeedRole } from '../utilities.js';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		if (!isDCStaff(interaction)) return youNeedRole(interaction, 'discordmoderator');

        const member = interaction.options.getMember('member') as Discord.GuildMember;

        await getChan(client, 'counting').permissionOverwrites.edit(member.user.id, { SendMessages: false });
        interaction.reply(`<@${member.user.id}>'s perm to send messages in <#${client.config.mainServer.channels.counting}> has been removed`);
	},
	data: new SlashCommandBuilder()
		.setName("discount")
		.setDescription("Remove someone's ability to count in #counting")
		.addUserOption(x=>x
			.setName("member")
			.setDescription("The member to give a 15% discount to")
			.setRequired(true))
};
