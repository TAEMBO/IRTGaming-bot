import Discord from 'discord.js';
import config from '../config.json' assert { type: 'json' };
import { Config } from '../typings.js';

/**
 * @param guildMemberOrInt A GuildMember or Interaction
 * @returns Whether the GuildMember is a Discord Staff member or not
 */
export function isDCStaff(guildMemberOrInt: Discord.GuildMember | Discord.ChatInputCommandInteraction<'cached'>) {
    const DCStaffRoles = config.mainServer.DCStaffRoles as Config['mainServer']['DCStaffRoles'];
    const mainServerRoles = config.mainServer.roles as Config['mainServer']['roles'];

    return DCStaffRoles.map(x => mainServerRoles[x]).some(x => {
        if ('roles' in guildMemberOrInt) {
            return guildMemberOrInt.roles.cache.has(x);
        } else return guildMemberOrInt.member.roles.cache.has(x);
    });
}