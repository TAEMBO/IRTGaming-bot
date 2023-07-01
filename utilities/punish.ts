import Discord from 'discord.js';
import YClient from '../client.js';
import { hasRole, isDCStaff, youNeedRole } from '../utilities.js';

/**
 * @param client 
 * @param interaction 
 * @param type The type of punishment this is
 */
export async function punish(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">, type: string) {
    if ((!isDCStaff(interaction.member)) || (!['warn', 'mute'].includes(type) && hasRole(interaction, 'discordhelper'))) return youNeedRole(interaction, 'discordmoderator');

    const time = interaction.options.getString('time') ?? undefined;
    const reason = interaction.options.getString('reason') ?? 'Unspecified';
    const GuildMember = interaction.options.getMember('member');
    const User = interaction.options.getUser('member', true);

    if (interaction.user.id === User.id) return interaction.reply(`You cannot ${type} yourself.`);
    if (!GuildMember && type !== 'ban') return interaction.reply(`You cannot ${type} someone who is not in the server.`);

    await interaction.deferReply();
    await client.punishments.addPunishment(type, interaction.user.id, reason, User, GuildMember, { time, interaction });
}