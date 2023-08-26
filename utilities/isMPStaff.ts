import config from '../config.json' assert { type: 'json' };
import { Config, GuildMemberIntOrMsg } from '../typings.js';

/**
 * @param guildMemberOrInt A GuildMember, Interaction, or Message
 * @returns Whether the GuildMember is an MP Staff member or not
 */
export function isMPStaff(guildMemberIntOrMsg: GuildMemberIntOrMsg) {
    return (config as Config).mainServer.mpStaffRoles
        .map(x => config.mainServer.roles[x])
        .some(x => {
            if ('roles' in guildMemberIntOrMsg) {
                return guildMemberIntOrMsg.roles.cache.has(x);
            } else return guildMemberIntOrMsg.member?.roles.cache.has(x);
        });
}