import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../structures/index.js";
import { punish } from "../../util/index.js";

export default new Command<"chatInput">({
    async run(interaction) {
        await punish(interaction, this.data.name);
    },
    data: new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Warn a member")
        .addUserOption(x => x
            .setName("member")
            .setDescription("The member to warn")
            .setRequired(true))
        .addStringOption(x => x
            .setName("reason")
            .setDescription("The reason for warning the member")
            .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
});
