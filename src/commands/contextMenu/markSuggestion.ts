import {
    ActionRowBuilder,
    ApplicationCommandType,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    ContextMenuCommandBuilder,
    EmbedBuilder
} from "discord.js";
import { Command } from "../../structures/index.js";
import { isDCStaff, isMPStaff, lookup, youNeedRole } from "../../util/index.js";

export default new Command<"message">({
    async run(interaction) {
        if (!isDCStaff(interaction.member) && !isMPStaff(interaction.member)) return await youNeedRole(interaction, "discordstaff");

        if (
            interaction.channelId !== interaction.client.config.mainServer.channels.communityIdeas
            || interaction.targetMessage.interaction?.commandName !== "suggest"
        ) return await interaction.reply({ content: "You need to select a message that is a community idea!", ephemeral: true });
        
        const embed = EmbedBuilder.from(interaction.targetMessage.embeds[0]);

        (await interaction.reply({
            content: "What do you want to mark this community idea as?",
            ephemeral: true,
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId("accept").setStyle(ButtonStyle.Success).setLabel("Accepted by staff"),
                    new ButtonBuilder().setCustomId("reject").setStyle(ButtonStyle.Danger).setLabel("Rejected by staff")
                ),
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId("cancel").setStyle(ButtonStyle.Secondary).setLabel("Cancel")
                )
            ]
        })).createMessageComponentCollector({
            max: 1,
            time: 30_000,
            componentType: ComponentType.Button
        }).on("collect", int => void lookup({
            async accept() {
                embed.setTitle("Community Idea - __**Seen and accepted by staff**__");

                await interaction.targetMessage.edit({ embeds: [embed] });
                await int.update({ content: "Community idea updated and marked as accepted", components: [] });
            },
            async reject() {
                embed.setTitle("Community Idea - __**Seen and rejected by staff**__");

                await interaction.targetMessage.edit({ embeds: [embed] });
                await int.update({ content: "Community idea updated and marked as rejected", components: [] });
            },
            async cancel() {
                await int.update({ content: "Command canceled", components: [] });
            }
        }, int.customId));
    },
    data: new ContextMenuCommandBuilder()
        .setName("Mark Suggestion")
        .setType(ApplicationCommandType.Message)
});