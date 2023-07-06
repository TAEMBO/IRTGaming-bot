import config from '../config.json' assert { type: 'json' };
import { Config, GuildMemberOrInt } from '../typings.js';

/**
 * @param guildMemberOrInt A GuildMember or Interaction
 * @returns An array of MF farms that the GuildMember is a member of
 */
export function onMFFarms(guildMemberOrInt: GuildMemberOrInt) {
    return (config as Config).mainServer.MFFarmRoles
        .map(x => config.mainServer.roles[x])
        .filter(x => {
            if ('roles' in guildMemberOrInt) {
                return guildMemberOrInt.roles.cache.has(x);
            } else return guildMemberOrInt.member.roles.cache.has(x);
        });
}