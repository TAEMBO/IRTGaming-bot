import type { GuildMember } from "discord.js";
import { fsServers } from "#util";

/**
 * @param guildMember The member to check
 * @returns An array of MF farm role IDs that the GuildMember is a member of
 */
export function onMFFarms(guildMember: GuildMember | null, serverAcro: string) {
    if (!guildMember) return [];
    
    const serverObj = fsServers.getPrivateOne(serverAcro);

    return Object.values(serverObj.roles.farms).filter(x => guildMember.roles.cache.has(x));
}