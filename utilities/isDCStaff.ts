import { GuildMemberIntOrMsg, TClient } from '../typings.js';

/**
 * @param guildMemberOrInt A GuildMember, Interaction, or Message
 * @returns Whether the GuildMember is a Discord Staff member or not
 */
export function isDCStaff(guildMemberIntOrMsg: GuildMemberIntOrMsg) {
    return (guildMemberIntOrMsg as TClient<typeof guildMemberIntOrMsg>).client.config.mainServer.dcStaffRoles
        .map(x => (guildMemberIntOrMsg as TClient<typeof guildMemberIntOrMsg>).client.config.mainServer.roles[x])
        .some(x => {
            if ('roles' in guildMemberIntOrMsg) {
                return guildMemberIntOrMsg.roles.cache.has(x);
            } else return guildMemberIntOrMsg.member?.roles.cache.has(x);
        });
}