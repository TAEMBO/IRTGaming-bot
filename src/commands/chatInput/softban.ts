import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../structures/index.js";
import { punish } from "../../util/index.js";

export default new Command<"chatInput">({
    async run(interaction) {
        await punish(interaction, this.data.name);
    },
    data: new SlashCommandBuilder()
        .setName("softban")
        .setDescription("Ban a member, delete their messages from the last day and unban them")
        .addUserOption(x => x
            .setName("member")
            .setDescription("The member to softban")
            .setRequired(true))
        .addStringOption(x => x
            .setName("reason")
            .setDescription("The reason for softbanning this member")
            .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
});
