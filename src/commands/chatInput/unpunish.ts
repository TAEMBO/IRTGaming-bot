import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Command } from "#structures";
import { hasRole, youNeedRole } from "#util";

export default new Command<"chatInput">({
    async run(interaction) {
        const punishment = await interaction.client.punishments.data.findById(interaction.options.getInteger("id", true));
        const reason = interaction.options.getString("reason") ?? "Unspecified";

        if (!punishment) return await interaction.reply("No case found with that ID");
        if (punishment.expired) return await interaction.reply("That case has already been overwritten");
        if (!["warn", "mute"].includes(punishment.type) && hasRole(interaction.member, "discordHelper")) return await youNeedRole(interaction, "discordModerator");
        
        await interaction.client.punishments.removePunishment(punishment._id, interaction.user.id, reason, interaction);
    },
    data: {
        name: "unpunish",
        description: "Overwrite a case",
        default_member_permissions: PermissionFlagsBits.ManageMessages.toString(),
        options: [
            {
                type: ApplicationCommandOptionType.Integer,
                name: "id",
                description: "Te ID of the punishment to overwrite",
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
