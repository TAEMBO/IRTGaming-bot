import Discord from 'discord.js';
import YClient from '../client.js';

/**
 * @param client 
 * @param channel The channel to get from config
 */
export function getChan(client: YClient, channel: keyof typeof client.config.mainServer.channels) {
    return client.channels.cache.get(client.config.mainServer.channels[channel]) as Discord.TextChannel;
}