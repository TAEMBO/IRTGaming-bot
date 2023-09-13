import { Config, GuildMemberIntOrMsg, TClient } from '../typings.js';

/**
 * @param guildMemberOrInt A GuildMember, Interaction, or Message
 * @param role The role to check for
 * @returns Whether the GuildMember has the given role or not
 */
export function hasRole(guildMemberIntOrMsg: GuildMemberIntOrMsg, role: keyof Config["mainServer"]["roles"]) {
    if ('roles' in guildMemberIntOrMsg) {
        return guildMemberIntOrMsg.roles.cache.has((guildMemberIntOrMsg as TClient<typeof guildMemberIntOrMsg>).client.config.mainServer.roles[role]);
    } else return Boolean(guildMemberIntOrMsg.member?.roles.cache.has((guildMemberIntOrMsg as TClient<typeof guildMemberIntOrMsg>).client.config.mainServer.roles[role]));
}