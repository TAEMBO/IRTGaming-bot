import { GuildMemberIntOrMsg, TClient } from '../typings.js';

/**
 * @param guildMemberOrInt A GuildMember, Interaction, or Message
 * @returns An array of MF farm role IDs that the GuildMember is a member of
 */
export function onMFFarms(guildMemberIntOrMsg: GuildMemberIntOrMsg) {
    return (guildMemberIntOrMsg as TClient<typeof guildMemberIntOrMsg>).client.config.mainServer.mfFarmRoles
        .map(x => (guildMemberIntOrMsg as TClient<typeof guildMemberIntOrMsg>).client.config.mainServer.roles[x])
        .filter(x => {
            if ('roles' in guildMemberIntOrMsg) {
                return guildMemberIntOrMsg.roles.cache.has(x);
            } else return guildMemberIntOrMsg.member?.roles.cache.has(x);
        });
}