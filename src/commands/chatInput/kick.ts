import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "#structures";
import { punish } from "#util";

export default new Command<"chatInput">({
    async run(interaction) {
        await punish(interaction, this.data.name);
    },
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Kick a member")
        .addUserOption(x => x
            .setName("member")
            .setDescription("The member to kick")
            .setRequired(true))
        .addStringOption(x => x
            .setName("reason")
            .setDescription("The reason for kicking the member")
            .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
});
