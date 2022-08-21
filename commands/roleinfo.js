const {SlashCommandBuilder} = require('discord.js');

module.exports = {
	run: (client, interaction) => {
		const role = interaction.options.getRole("role");
		const keyPermissions = ['Administrator', 'KickMembers', 'BanMembers', 'ManageChannels', 'ManageGuild', 'ViewAuditLog', 'ManageMessages', 'MentionEveryone', 'UseExternalEmojis', 'ManageRoles', 'ManageEmojisAndStickers', 'ModerateMembers'];
		const permissions = role.permissions.toArray();
		const Role = role.members.map(e=>`**${e.user.tag}**`).join("\n") || "";
		const embed = new client.embed()
			.setTitle(`Role Info: ${role.name}`)
			.addFields(
			{name: '🔹 ID', value: `\`${role.id}\``, inline: true},
			{name: '🔹 Color', value: `\`${role.hexColor}\``, inline: true},
			{name: '🔹 Creation Date', value: `<t:${Math.round(new Date(role.createdTimestamp) / 1000)}>\n<t:${Math.round(new Date(role.createdTimestamp) / 1000)}:R> `, inline: true},
			{name: '🔹 Misc', value: `Hoist: \`${role.hoist}\`\nMentionable: \`${role.mentionable}\`\nPosition: \`${role.position}\` from bottom\nMembers: \`${role.members.size}\`\n${role.members.size < 11 ? Role : ''}`, inline: true},
			{name: '🔹 Key Permissions', value: (permissions.includes('Administrator') ? ['Administrator'] : permissions.filter(x => keyPermissions.includes(x))).map(x => {    return x.split('_').map((y, i) => y).join(' ')}).join(', ') || 'None', inline: true})
			.setColor(role.color || '#fefefe')
			.setThumbnail(role?.iconURL())
		interaction.reply({embeds: [embed]});
	},
	data: new SlashCommandBuilder()
		.setName("roleinfo")
		.setDescription("Get's information about a role.")
		.addRoleOption((opt)=>opt
			.setName("role")
			.setDescription("The role to get information on.")
			.setRequired(true))
}
