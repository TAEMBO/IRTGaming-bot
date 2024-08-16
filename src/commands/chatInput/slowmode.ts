import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "#structures";

export default new Command<"chatInput">({
    async run(interaction) {
        const time = interaction.options.getInteger("time", true);

        await interaction.channel!.setRateLimitPerUser(time, `Done by ${interaction.user.tag}`);

        await interaction.reply({
            content: time ? `Slowmode set to \`${time}\` ${time === 1 ? "second" : "seconds"}` : "Slowmode removed",
            ephemeral: true,
        });
    },
    data: new SlashCommandBuilder()
        .setName("slowmode")
        .setDescription("Set a slowmode in this channel")
        .addIntegerOption(x => x.setName("time").setDescription("The time amount for the slowmode").setRequired(true).setMaxValue(21600))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
});
