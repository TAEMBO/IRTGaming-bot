import {
    ActionRowBuilder,
    ApplicationCommandType,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder
} from "discord.js";
import { Command } from "#structures";
import { isDCStaff, isMPStaff, youNeedRole } from "#util";

export default new Command<"message">({
    async run(interaction) {
        if (!isDCStaff(interaction.member) && !isMPStaff(interaction.member)) return await youNeedRole(interaction, "discordStaff");

        if (
            interaction.channelId !== interaction.client.config.mainServer.channels.communityIdeas
            || interaction.targetMessage.embeds[0]?.title !== "Community Idea"
        ) return await interaction.reply({ content: "You need to select a message that is a community idea!", ephemeral: true });
        
        const embed = EmbedBuilder.from(interaction.targetMessage.embeds[0]);
        const msg = await interaction.reply({
            content: "What do you want to mark this community idea as?",
            ephemeral: true,
            fetchReply: true,
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId("like").setStyle(ButtonStyle.Success).setLabel("Liked by staff"),
                    new ButtonBuilder().setCustomId("dislike").setStyle(ButtonStyle.Danger).setLabel("Disliked by staff")
                ),
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId("cancel").setStyle(ButtonStyle.Secondary).setLabel("Cancel")
                )
            ]
        });
        
        msg.createMessageComponentCollector({
            max: 1,
            time: 30_000,
            componentType: ComponentType.Button
        }).on("collect", async int => {
            switch (int.customId) {
                case "like": {
                    embed.setTitle("Community Idea\n__**Acknowledged and liked by staff**__");

                    await interaction.targetMessage.edit({ embeds: [embed] });
                    await int.update({ content: "Community idea updated and marked as liked", components: [] });
                
                    break;
                };
                case "dislike": {
                    embed.setTitle("Community Idea\n__**Acknowledged and disliked by staff**__");

                    await interaction.targetMessage.edit({ embeds: [embed] });
                    await int.update({ content: "Community idea updated and marked as disliked", components: [] });

                    break;
                };
                case "cancel": {
                    await int.update({ content: "Command canceled", components: [] });

                    break;
                }
            }
        });
    },
    data: {
        name: "Mark Suggestion",
        type: ApplicationCommandType.Message
    }
});