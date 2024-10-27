import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { Command } from "#structures";
import { formatString, hasRole, youNeedRole } from "#util";

export default new Command<"chatInput">({
    async run(interaction) {
        const caseId = interaction.options.getInteger("id", true);
        const punishment = await interaction.client.punishments.data.findById(caseId);
        const reason = interaction.options.getString("reason") ?? "Unspecified";

        if (!punishment) return await interaction.reply("No case found with that ID!");
        if (punishment.expired) return await interaction.reply(`Case #${caseId} has already been overwritten!`);
        if (!["warn", "mute"].includes(punishment.type) && hasRole(interaction.member, "discordHelper")) return await youNeedRole(interaction, "discordModerator");

        await interaction.deferReply();

        let caseDoc;

        try {
            caseDoc = await interaction.client.punishments.removePunishment(punishment, interaction.user.id, reason);
        } catch (err: any) {
            return await interaction.editReply(err.message);
        }

        const user = await interaction.client.users.fetch(caseDoc.member._id);

        await interaction.editReply({ embeds: [new EmbedBuilder()
            .setColor(interaction.client.config.EMBED_COLOR)
            .setTitle(`Case #${caseDoc._id}: ${formatString(caseDoc.type)}`)
            .setDescription(`${user.tag}\n${user}\n(\`${user.id}\`)`)
            .addFields(
                { name: "Reason", value: reason },
                { name: "Overwrites", value: `Case #${punishment._id}` })
        ] });
    },
    data: {
        name: "unpunish",
        description: "Overwrite a case",
        default_member_permissions: PermissionFlagsBits.ManageMessages.toString(),
        options: [
            {
                type: ApplicationCommandOptionType.Integer,
                name: "id",
                description: "The ID of the punishment to overwrite",
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: "reason",
                description: "The reason for overwriting the punishment"
            }
        ]
    }
});
