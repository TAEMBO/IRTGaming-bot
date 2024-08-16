import type { GuildMember } from "discord.js";

/**
 * @param guildMember The member to check
 * @returns Whether the GuildMember is an IRTMC Staff member or not
 */
export function isMCStaff(guildMember: GuildMember | null) {
    if (!guildMember) return false;

    return guildMember.roles.cache.has(guildMember.client.config.mainServer.roles.irtmcStaff);
}
