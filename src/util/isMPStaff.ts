import { GuildMember } from 'discord.js';

/**
 * @param guildMember The member to check
 * @returns Whether the GuildMember is an MP Staff member or not
 */
export function isMPStaff(guildMember: GuildMember | null) {
    if (!guildMember) return false;

    return guildMember.client.config.mainServer.mpStaffRoles
        .map(x => guildMember.client.config.mainServer.roles[x])
        .some(x => guildMember.roles.cache.has(x));
}