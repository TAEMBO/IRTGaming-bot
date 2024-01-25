import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../utils.js";

export default new Command<"chatInput">({
	async run(interaction) {
		const role = interaction.options.getRole("role", true);
		const keyPermissions = ['Administrator', 'KickMembers', 'BanMembers', 'ManageChannels', 'ManageGuild', 'ViewAuditLog', 'ManageMessages', 'ManageNicknames', 'MentionEveryone', 'UseExternalEmojis', 'ManageRoles', 'ManageEmojisAndStickers', 'ModerateMembers'];
		const permissions = role.permissions.toArray();
		const roleMembers = role.members.map(e =>`**${e.user.tag}**`).join("\n") || "";
        const includedPermissions = permissions.includes('Administrator') ? ['Administrator'] : permissions.filter(x => keyPermissions.includes(x));

		await interaction.reply({ embeds: [new EmbedBuilder()
			.setTitle(`Role Info: ${role.name}`)
			.addFields(
				{ name: '🔹 ID', value: `\`${role.id}\``, inline: true},
				{ name: '🔹 Color', value: `\`${role.hexColor}\``, inline: true},
				{ name: '🔹 Created', value: `<t:${Math.round(role.createdTimestamp/1000)}:R> `, inline: true },
				{ name: '🔹 Misc', value: [
                    `Hoist: \`${role.hoist}\``,
                    `Mentionable: \`${role.mentionable}\``,
                    `Position: \`${role.position}\` from bottom`,
                    `Members: \`${role.members.size}\`\n${role.members.size < 21 ? roleMembers : ''}`
                ].join('\n'), inline: true },
				{ name: '🔹 Key Permissions', value: includedPermissions.join(', ') || 'None', inline: true })
			.setColor(role.color || "#ffffff")
			.setThumbnail(role.iconURL())
		] });
	},
	data: new SlashCommandBuilder()
		.setName("roleinfo")
		.setDescription("Get information about a role")
		.addRoleOption(x => x
			.setName("role")
			.setDescription("The role to get information on")
			.setRequired(true))
});
