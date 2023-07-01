import Discord from 'discord.js';
import config from '../config.json' assert { type: 'json' };

/**
 * @param interaction 
 * @param role The role that will be presented in the reply
 * @returns to the given interaction with a standardized message informing the need for the given role
 */
export async function youNeedRole(interaction: Discord.ChatInputCommandInteraction<"cached">, role: keyof typeof config.mainServer.roles) {
    return await interaction.reply(`You need the <@&${config.mainServer.roles[role]}> role to use this command`);
}