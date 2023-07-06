import config from '../config.json' assert { type: 'json' };
import { Config, GuildMemberOrInt } from '../typings.js';

/**
 * @param guildMemberOrInt A GuildMember or Interaction
 * @returns Whether the GuildMember is a Discord Staff member or not
 */
export function isDCStaff(guildMemberOrInt: GuildMemberOrInt) {
    return (config as Config).mainServer.DCStaffRoles
        .map(x => config.mainServer.roles[x])
        .some(x => {
            if ('roles' in guildMemberOrInt) {
                return guildMemberOrInt.roles.cache.has(x);
            } else return guildMemberOrInt.member.roles.cache.has(x);
        });
}