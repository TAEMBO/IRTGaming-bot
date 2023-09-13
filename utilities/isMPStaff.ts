import { GuildMemberIntOrMsg, TClient } from '../typings.js';

/**
 * @param guildMemberOrInt A GuildMember, Interaction, or Message
 * @returns Whether the GuildMember is an MP Staff member or not
 */
export function isMPStaff(guildMemberIntOrMsg: GuildMemberIntOrMsg) {
    return (guildMemberIntOrMsg as TClient<typeof guildMemberIntOrMsg>).client.config.mainServer.mpStaffRoles
        .map(x => (guildMemberIntOrMsg as TClient<typeof guildMemberIntOrMsg>).client.config.mainServer.roles[x])
        .some(x => {
            if ('roles' in guildMemberIntOrMsg) {
                return guildMemberIntOrMsg.roles.cache.has(x);
            } else return guildMemberIntOrMsg.member?.roles.cache.has(x);
        });
}