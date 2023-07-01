import Discord from 'discord.js';
import YClient from '../client.js';

/**
 * @param client 
 * @returns The main Guild that this bot is made for
 */
export function mainGuild(client: YClient) {
    return client.guilds.cache.get(client.config.mainServer.id) as Discord.Guild;
}