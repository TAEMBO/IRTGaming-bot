import type { GuildMember } from "discord.js";
import { fs22Servers } from "#util";

/**
 * @param guildMember The member to check
 * @param serverAcro The private server to check for farm membership on
 * @returns An array of private server farm role IDs that the GuildMember is a member of
 */
export function onPrivate22Farms(guildMember: GuildMember | null, serverAcro: string) {
    if (!guildMember) return [];

    const serverObj = fs22Servers.getPrivateOne(serverAcro);

    return Object.values(serverObj.farms).map(x => x.roleId).filter(x => guildMember.roles.cache.has(x));
}