import Discord from 'discord.js';
import config from '../config.json' assert { type: 'json' };
import { Config } from '../typings.js';

/**
 * @param guildMemberOrInt A GuildMember or Interaction
 * @returns An array of MF farms that the GuildMember is a member of
 */
export function onMFFarms(guildMemberOrInt: Discord.GuildMember | Discord.ChatInputCommandInteraction<'cached'>) {
    const MFFarmRoles = config.mainServer.MPStaffRoles as Config['mainServer']['MFFarmRoles'];
    const mainServerRoles = config.mainServer.roles as Config['mainServer']['roles'];

    return MFFarmRoles.map(x => mainServerRoles[x]).filter(x => {
        if ('roles' in guildMemberOrInt) {
            return guildMemberOrInt.roles.cache.has(x);
        } else return guildMemberOrInt.member.roles.cache.has(x);
    });
}