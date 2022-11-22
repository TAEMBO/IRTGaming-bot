import Discord, { SlashCommandBuilder } from 'discord.js';
import { YClient } from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		if (!client.hasModPerms(interaction.member)) return client.youNeedRole(interaction, "mod");
        const member = interaction.options.getMember('member') as Discord.GuildMember;

        (client.channels.resolve('855577815491280958') as Discord.TextChannel).permissionOverwrites.edit(member.user.id, { SendMessages: false });
        interaction.reply(`<@${member.user.id}>'s perm to send messages in <#855577815491280958> has been removed`)
	},
	data: new SlashCommandBuilder()
		.setName("discount")
		.setDescription("Remove someone's ability to count in #counting")
		.addUserOption((opt)=>opt
			.setName("member")
			.setDescription("The member to give a 15% discount to")
			.setRequired(true))
};
