import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

/**
 * Generates button components for acknowledging a given action 
 * @returns Respective `confirm` & `cancel` button components - action row & array-wrapped
 */
export function ackButtons() {
    return [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId("confirm")
            .setStyle(ButtonStyle.Success)
            .setLabel("Confirm"),
        new ButtonBuilder()
            .setCustomId("cancel")
            .setStyle(ButtonStyle.Danger)
            .setLabel("Cancel"))
    ];
}