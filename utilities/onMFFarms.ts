import { GuildMember } from 'discord.js';
import { TClient } from '../typings.js';

/**
 * @param guildMember The member to check
 * @returns An array of MF farm role IDs that the GuildMember is a member of
 */
export function onMFFarms(guildMember: GuildMember | null) {
    if (!guildMember) return [];

    return (guildMember as TClient<typeof guildMember>).client.config.mainServer.mfFarmRoles
        .map(x => (guildMember as TClient<typeof guildMember>).client.config.mainServer.roles[x])
        .filter(x => guildMember.roles.cache.has(x));
}