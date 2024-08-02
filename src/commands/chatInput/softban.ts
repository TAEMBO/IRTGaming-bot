import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "#structures";
import { punish } from "#util";

export default new Command<"chatInput">({
    async run(interaction) {
        await punish(interaction, this.data.name);
    },
    data: new SlashCommandBuilder()
        .setName("softban")
        .setDescription("Ban a member, delete their last day of messages, and unban them")
        .addUserOption(x => x
            .setName("member")
            .setDescription("The member to softban")
            .setRequired(true))
        .addStringOption(x => x
            .setName("reason")
            .setDescription("The reason for softbanning the member")
            .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
});
