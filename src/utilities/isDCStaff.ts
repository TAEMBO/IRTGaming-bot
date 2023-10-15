import { GuildMember } from 'discord.js';
import { TClient } from '../typings.js';

/**
 * @param guildMember The member to check
 * @returns Whether the GuildMember is a Discord Staff member or not
 */
export function isDCStaff(guildMember: GuildMember | null) {
    if (!guildMember) return false;

    return (guildMember as TClient<typeof guildMember>).client.config.mainServer.dcStaffRoles
        .map(x => (guildMember as TClient<typeof guildMember>).client.config.mainServer.roles[x])
        .some(x => guildMember.roles.cache.has(x));
}