import { GuildMember } from 'discord.js';
import { TClient } from '../typings.js';

/**
 * @param guildMember The member to check
 * @returns Whether the GuildMember is an MP Staff member or not
 */
export function isMPStaff(guildMember: GuildMember | null) {
    if (!guildMember) return false;

    return (guildMember as TClient<typeof guildMember>).client.config.mainServer.mpStaffRoles
        .map(x => (guildMember as TClient<typeof guildMember>).client.config.mainServer.roles[x])
        .some(x => guildMember.roles.cache.has(x));
}