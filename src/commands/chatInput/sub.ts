import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle } from "discord.js";
import { Command } from "#structures";

export default new Command<"chatInput">({
    async run(interaction) {
        await interaction.reply({
            content: `Verification sent. Please wait for someone to verify your subscription, you will then receive the <@&${interaction.client.config.mainServer.roles.subscriber}> role.`,
            ephemeral: true
        });
        
        await interaction.client.getChan("helperChat").send({
            content: `${interaction.user} (${interaction.user.tag}) Subscriber role verification`,
            files: [interaction.options.getAttachment("image", true)],
            components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setLabel("Accept").setCustomId(`sub-yes-${interaction.user.id}`).setStyle(ButtonStyle.Success),
                new ButtonBuilder().setLabel("Deny").setCustomId(`sub-no-${interaction.user.id}`).setStyle(ButtonStyle.Danger)
            )]
        });
    },
    data: {
        name: "sub",
        description: "Verify your YT subscription to IRTGaming",
        options: [
            {
                type: ApplicationCommandOptionType.Attachment,
                name: "image",
                description: "Image proving subscription",
                required: true
            }
        ]
    }
});
