import Discord, { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import YClient from '../client.js';
import { getChan } from '../utilities.js';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        interaction.reply({content: `Verification sent, please wait for someone to verify your subscription. You will then receive the <@&${client.config.mainServer.roles.subscriber}> role.`, ephemeral: true});
        getChan(client, 'helperChat').send({
            content: `<@${interaction.user.id}> (${interaction.user.tag}) Subscriber role verification`,
            files: [interaction.options.getAttachment('image', true)],
            components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setLabel('Accept').setCustomId(`sub-yes-${interaction.user.id}`).setStyle(ButtonStyle.Success),
                new ButtonBuilder().setLabel('Deny').setCustomId(`sub-no-${interaction.user.id}`).setStyle(ButtonStyle.Danger)
            )]
        });
    },
    data: new SlashCommandBuilder()
        .setName("sub")
        .setDescription("Verify your YT subscription to IRT")
        .addAttachmentOption(x=>x
            .setName('image')
            .setDescription('Image proving subscription')
            .setRequired(true))
}
