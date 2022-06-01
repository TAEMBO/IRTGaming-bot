const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
	run: (client, interaction) => {
		const role = interaction.options.getRole("role");
		const keyPermissions = ['ADMINISTRATOR', 'KICK_MEMBERS', 'BAN_MEMBERS', 'MANAGE_CHANNELS', 'MANAGE_GUILD', 'VIEW_AUDIT_LOG', 'MANAGE_MESSAGES', 'MENTION_EVERYONE', 'USE_EXTERNAL_EMOJIS', 'MANAGE_ROLES', 'MANAGE_EMOJIS_AND_STICKERS', 'MODERATE_MEMBERS'];
		const permissions = role.permissions.toArray();
		const embed = new client.embed()
			.setTitle('Role Info: ' + role.name)
			.addFields(
			{name: '🔹 Id', value: role.id},
			{name: '🔹 Color', value: `\`${role.hexColor}\``},
			{name: '🔹 Creation Date', value: `<t:${Math.round(new Date(role.createdTimestamp) / 1000)}>\n<t:${Math.round(new Date(role.createdTimestamp) / 1000)}:R>`},
			{name: '🔹 Misc', value: `Hoist: \`${role.hoist}\`\nMentionable: \`${role.mentionable}\`\nPosition: \`${role.position}\` from bottom\nMembers: at least \`${role.members.size}\``},
			{name: '🔹 Key Permissions', value: (permissions.includes('ADMINISTRATOR') ? ['ADMINISTRATOR'] : permissions.filter(x => keyPermissions.includes(x))).map(x => {    return x.split('_').map((y, i) => i === 0 ? y[0] + y.slice(1).toLowerCase() : y.toLowerCase()).join(' ')}).join(', ') || 'None'})
			.setColor(role.color || '#fefefe')
			.setThumbnail(role?.iconURL())
		interaction.reply({embeds: [embed], allowedMentions: { repliedUser: false }});
	},
	data: new SlashCommandBuilder().setName("roleinfo").setDescription("Get's information about a role.").addRoleOption((opt)=>opt.setName("role").setDescription("The role to get information on.").setRequired(true))
}
