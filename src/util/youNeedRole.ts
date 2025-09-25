import { type CommandInteraction, MessageFlags, roleMention } from "discord.js";
import type { Config } from "#typings";

/**
 * @param interaction The interaction to reply to
 * @param role The role that will be presented in the reply
 * @returns to the given interaction with a standardized message informing the need for the given role
 */
export function youNeedRole(interaction: CommandInteraction, role: keyof Config["mainServer"]["roles"]) {
    return interaction.reply({
        content: `You need the ${roleMention(interaction.client.config.mainServer.roles[role])} role to use this command`,
        flags: MessageFlags.Ephemeral
    });
}