import Discord, { EmbedBuilder } from 'discord.js';
import { formatUser } from '../utilities.js';
import { TClient } from '../typings.js';

export default async (member: TClient<Discord.GuildMember>) => {
    if (!member.client.config.botSwitches.logs || member.partial) return;

    await member.roles.add(member.client.config.mainServer.roles.member).catch(() => null);
    
    const newInvites = await member.guild.invites.fetch();
    const usedInvite = newInvites.find(inv => member.client.invites.get(inv.code)?.uses as number < (inv.uses as number));
    const evadingCase = await member.client.punishments.data.findOne({ 'member._id': member.user.id, type: 'detain', expired: undefined });

    for (const [code, inv] of newInvites) member.client.invites.set(code, { uses: inv.uses, creator: inv.inviter?.id });
 
    await member.client.getChan('botLogs').send({ embeds: [new EmbedBuilder()
        .setTitle(`Member Joined: ${member.user.tag}`)
        .setDescription(formatUser(member.user))
        .setFields(
            { name: '🔹 Account Created', value: `<t:${Math.round(member.user.createdTimestamp / 1000)}:R>` },
            { name: '🔹 Invite Data', value: usedInvite ? `Invite: \`${usedInvite.code}\`\nCreated by: **${usedInvite.inviter?.tag}**` : 'No data found' })
        .setColor(member.client.config.embedColorGreen)
        .setTimestamp()
        .setThumbnail(member.user.displayAvatarURL({ extension: 'png', size: 2048 }))
    ] });

    if (evadingCase) await member.roles.add(member.client.config.mainServer.roles.detained);
}
