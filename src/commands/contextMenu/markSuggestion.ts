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
        if (!isDCStaff(interaction.member) && !isMPStaff(interaction.member)) return await youNeedRole(interaction, "discordStaff");

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
                    new ButtonBuilder().setCustomId("like").setStyle(ButtonStyle.Success).setLabel("Liked by staff"),
                    new ButtonBuilder().setCustomId("dislike").setStyle(ButtonStyle.Danger).setLabel("Disliked by staff")
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
            async like() {
                embed.setTitle("Community Idea\n__**Acknowledged and liked by staff**__");

                await interaction.targetMessage.edit({ embeds: [embed] });
                await int.update({ content: "Community idea updated and marked as liked", components: [] });
            },
            async dislike() {
                embed.setTitle("Community Idea\n__**Acknowledged and disliked by staff**__");

                await interaction.targetMessage.edit({ embeds: [embed] });
                await int.update({ content: "Community idea updated and marked as disliked", components: [] });
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