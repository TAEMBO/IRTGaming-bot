import type { GuildMember } from "discord.js";
import type { Config } from "../typings.js";

/**
 * @param guildMember The member to check
 * @param role The role to check for
 * @returns Whether the GuildMember has the given role or not
 */
export function hasRole(guildMember: GuildMember | null, role: keyof Config["mainServer"]["roles"]) {
    if (!guildMember) return false;

    return guildMember.roles.cache.has(guildMember.client.config.mainServer.roles[role]);
}