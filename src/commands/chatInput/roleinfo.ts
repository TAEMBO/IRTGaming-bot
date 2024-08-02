import { EmbedBuilder, PermissionFlagsBits, PermissionsBitField, SlashCommandBuilder, time } from "discord.js";
import { Command } from "#structures";

export default new Command<"chatInput">({
    async run(interaction) {
        const role = interaction.options.getRole("role", true);
        const keyPermissions = [
            PermissionFlagsBits.Administrator,
            PermissionFlagsBits.KickMembers,
            PermissionFlagsBits.BanMembers,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageGuild,
            PermissionFlagsBits.ViewAuditLog,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ManageNicknames,
            PermissionFlagsBits.MentionEveryone,
            PermissionFlagsBits.UseExternalEmojis,
            PermissionFlagsBits.ManageRoles,
            PermissionFlagsBits.ManageGuildExpressions,
            PermissionFlagsBits.ModerateMembers
        ];    
        const roleMembers = role.members.map(member => `**${member.user.tag}**`).join("\n");
        const includedPermissions = role.permissions.has(PermissionFlagsBits.Administrator)
            ? [PermissionFlagsBits.Administrator]
            : keyPermissions.filter(perm => role.permissions.has(perm, false));

        await interaction.reply({ embeds: [new EmbedBuilder()
            .setTitle(`Role Info: ${role.name}`)
            .addFields(
                { name: "🔹 ID", value: `\`${role.id}\``, inline: true },
                { name: "🔹 Color", value: `\`${role.hexColor}\``, inline: true },
                { name: "🔹 Created", value: time(role.createdAt, "R"), inline: true },
                { name: "🔹 Misc", value: [
                    `Hoist: \`${role.hoist}\``,
                    `Mentionable: \`${role.mentionable}\``,
                    `Position: \`${role.position}\` from bottom`,
                    `Members: \`${role.members.size}\`\n${role.members.size < 21 ? roleMembers : ""}`
                ].join("\n"), inline: true },
                { name: "🔹 Key Permissions", value: new PermissionsBitField(includedPermissions).toArray().join(", ") || "None", inline: true })
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
