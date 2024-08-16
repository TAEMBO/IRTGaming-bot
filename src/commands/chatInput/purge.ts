import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "#structures";

export default new Command<"chatInput">({
    async run(interaction) {
        const limit = interaction.options.getInteger("amount", true);
        const user = interaction.options.getUser("user");
        const msgs = (await interaction.channel!.messages.fetch({ limit })).filter(msg => (user ? msg.author.id === user.id : true));

        await interaction.channel!.bulkDelete(msgs, true);
        await interaction.reply({
            content: `Successfully deleted ${msgs.size} messages${user ? ` from ${user}` : ""}.`,
            ephemeral: true,
        });
    },
    data: new SlashCommandBuilder()
        .setName("purge")
        .setDescription("Purge messages in this channel")
        .addIntegerOption(x => x.setName("amount").setDescription("The amount of messages to purge").setRequired(true).setMaxValue(100))
        .addUserOption(x => x.setName("user").setDescription("The user whose messages to purge").setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
});
