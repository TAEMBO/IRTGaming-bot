import { CommandInteraction } from 'discord.js';
import { Config } from '../typings.js';

/**
 * @param interaction 
 * @param role The role that will be presented in the reply
 * @returns to the given interaction with a standardized message informing the need for the given role
 */
export async function youNeedRole(interaction: CommandInteraction, role: keyof Config["mainServer"]["roles"]) {
    return await interaction.reply(`You need the <@&${interaction.client.config.mainServer.roles[role]}> role to use this command`);
}