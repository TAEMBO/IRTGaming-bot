import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "#structures";
import { punish } from "#util";

export default new Command<"chatInput">({
    async run(interaction) {
        await punish(interaction, this.data.name);
    },
    data: new SlashCommandBuilder()
        .setName("mute")
        .setDescription("Mute a member")
        .addUserOption(x => x.setName("member").setDescription("The member to mute").setRequired(true))
        .addStringOption(x => x.setName("time").setDescription("The duration of the mute").setRequired(false))
        .addStringOption(x => x.setName("reason").setDescription("The reason for muting the member").setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
});
