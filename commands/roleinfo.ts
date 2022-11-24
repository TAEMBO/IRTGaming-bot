import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		const role = interaction.options.getRole("role") as Discord.Role;
		const keyPermissions = ['Administrator', 'KickMembers', 'BanMembers', 'ManageChannels', 'ManageGuild', 'ViewAuditLog', 'ManageMessages', 'MentionEveryone', 'UseExternalEmojis', 'ManageRoles', 'ManageEmojisAndStickers', 'ModerateMembers'];
		const permissions = role.permissions.toArray();
		const Role = role.members.map((e: Discord.GuildMember) =>`**${e.user.tag}**`).join("\n") || "";
		const embed = new client.embed()
			.setTitle(`Role Info: ${role.name}`)
			.addFields(
			{name: '🔹 ID', value: `\`${role.id}\``, inline: true},
			{name: '🔹 Color', value: `\`${role.hexColor}\``, inline: true},
			{name: '🔹 Creation Date', value: `<t:${Math.round(role.createdTimestamp/1000)}>\n<t:${Math.round(role.createdTimestamp/1000)}:R> `, inline: true},
			{name: '🔹 Misc', value: `Hoist: \`${role.hoist}\`\nMentionable: \`${role.mentionable}\`\nPosition: \`${role.position}\` from bottom\nMembers: \`${role.members.size}\`\n${role.members.size < 21 ? Role : ''}`, inline: true},
			{name: '🔹 Key Permissions', value: (permissions.includes('Administrator') ? ['Administrator'] : permissions.filter((x: string) => keyPermissions.includes(x))).map((x: string) => {    return x.split('_').map((y, i) => y).join(' ')}).join(', ') || 'None', inline: true})
			.setColor(role.color || '#fefefe')
			.setThumbnail(role?.iconURL())
		interaction.reply({embeds: [embed]});
	},
	data: new SlashCommandBuilder()
		.setName("roleinfo")
		.setDescription("Get information about a role")
		.addRoleOption((opt)=>opt
			.setName("role")
			.setDescription("The role to get information on")
			.setRequired(true))
}
