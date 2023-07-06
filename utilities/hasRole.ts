import config from '../config.json' assert { type: 'json' };
import { GuildMemberOrInt } from '../typings.js';

/**
 * @param guildMemberOrInt A GuildMember or Interaction
 * @param role The role to check for
 * @returns Whether the GuildMember has the given role or not
 */
export function hasRole(guildMemberOrInt: GuildMemberOrInt, role: keyof typeof config.mainServer.roles) {
    if ('roles' in guildMemberOrInt) {
        return guildMemberOrInt.roles.cache.has(config.mainServer.roles[role]);
    } else return guildMemberOrInt.member.roles.cache.has(config.mainServer.roles[role]);
}