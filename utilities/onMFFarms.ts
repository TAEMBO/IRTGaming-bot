import config from '../config.json' assert { type: 'json' };
import { Config, GuildMemberIntOrMsg } from '../typings.js';

/**
 * @param guildMemberOrInt A GuildMember, Interaction, or Message
 * @returns An array of MF farm role IDs that the GuildMember is a member of
 */
export function onMFFarms(guildMemberIntOrMsg: GuildMemberIntOrMsg) {
    return (config as Config).mainServer.mfFarmRoles
        .map(x => config.mainServer.roles[x])
        .filter(x => {
            if ('roles' in guildMemberIntOrMsg) {
                return guildMemberIntOrMsg.roles.cache.has(x);
            } else return guildMemberIntOrMsg.member?.roles.cache.has(x);
        });
}