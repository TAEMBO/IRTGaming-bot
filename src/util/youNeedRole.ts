import { type CommandInteraction, MessageFlags, roleMention } from "discord.js";
import type { Config } from "#typings";

/**
 * @param interaction The interaction to reply to
 * @param role The role that will be presented in the reply
 * @returns to the given interaction with a standardized message informing the need for the given role
 */
export function youNeedRole(interaction: CommandInteraction, role: keyof Config["mainServer"]["roles"]) {
<<<<<<< HEAD
    return interaction.reply({
        content: `You need the ${roleMention(interaction.client.config.mainServer.roles[role])} role to use this command`,
        flags: MessageFlags.Ephemeral
    });
}
=======
    const roleId = interaction.client.config.mainServer.roles[role];

    return interaction.reply({
        content: roleId
            ? `You need the ${roleMention(roleId)} role to use this command`
            : `This command requires the configured role \`${String(role)}\`, but it is missing from config.`,
        flags: MessageFlags.Ephemeral
    });
}
>>>>>>> e0ae159 (clean: config validation + crash fixes)
