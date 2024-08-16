import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "#structures";

export default new Command<"chatInput">({
    async run(interaction) {
        const member = interaction.options.getMember("member");

        if (!member) return await interaction.reply({ content: "You need to select a member that is in this server", ephemeral: true });

        await interaction.client.getChan("counting").permissionOverwrites.edit(member, { SendMessages: false });
        await interaction.reply(
            `${member}'s permisson to send messages in <#${interaction.client.config.mainServer.channels.counting}> has been removed`,
        );
    },
    data: new SlashCommandBuilder()
        .setName("discount")
        .setDescription("Remove a member's ability to participate in #counting")
        .addUserOption(x => x.setName("member").setDescription("The member to restrict participation for").setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
});
