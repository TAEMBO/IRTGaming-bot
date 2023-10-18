import { EmbedBuilder, GuildMember } from 'discord.js';
import { formatUser } from '../utilities.js';

export default async (member: GuildMember) => {
    if (!member.client.config.botSwitches.logs || member.partial) return;

    await member.roles.add(member.client.config.mainServer.roles.member).catch(() => null);
    
    const newInvites = await member.guild.invites.fetch();
    const usedInvite = newInvites.find(inv => (member.client.inviteCache.get(inv.code)?.uses ?? 0) < (inv.uses ?? 0));
    const evadingCase = await member.client.punishments.data.findOne({ 'member._id': member.user.id, type: 'detain', expired: undefined });
 
    const embed = new EmbedBuilder()
        .setTitle(`Member Joined: ${member.user.tag}`)
        .setDescription(formatUser(member.user))
        .setColor(member.client.config.embedColorGreen)
        .setTimestamp()
        .setThumbnail(member.user.displayAvatarURL({ extension: 'png', size: 2048 }))
        .setFields({ name: "🔹 Account Created", value: `<t:${Math.round(member.user.createdTimestamp / 1_000)}:R>` });

    if (usedInvite) embed.addFields({ name: "🔹 Invite Data", value: `Invite: \`${usedInvite.code}\`\nCreated by: **${usedInvite.inviter?.tag}**`});

    await member.client.getChan('botLogs').send({ embeds: [embed] });

    if (evadingCase) await member.roles.add(member.client.config.mainServer.roles.detained);
}
