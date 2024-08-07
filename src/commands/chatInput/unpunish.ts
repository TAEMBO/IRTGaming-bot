import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "#structures";
import { hasRole, youNeedRole } from "#util";

export default new Command<"chatInput">({
    async run(interaction) {
        const punishment = await interaction.client.punishments.data.findById(interaction.options.getInteger("caseid", true));
        const reason = interaction.options.getString("reason") ?? "Unspecified";

        if (!punishment) return await interaction.reply("No case found with that ID");
        if (punishment.expired) return await interaction.reply("That case has already been overwritten");
        if (!["warn", "mute"].includes(punishment.type) && hasRole(interaction.member, "discordHelper")) return await youNeedRole(interaction, "discordModerator");
        
        await interaction.client.punishments.removePunishment(punishment._id, interaction.user.id, reason, interaction);
    },
    data: new SlashCommandBuilder()
        .setName("unpunish")
        .setDescription("Unpunish a member")
        .addIntegerOption(x => x
            .setName("caseid")
            .setDescription("The ID of the punishment to overwrite")
            .setRequired(true))
        .addStringOption(x => x
            .setName("reason")
            .setDescription("The reason for overwriting the punishment")
            .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
});