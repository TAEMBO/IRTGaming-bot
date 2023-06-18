import Discord from 'discord.js';
import YClient from '../client.js';

export default async (client: YClient, member: Discord.GuildMember) => {
    if (!client.config.botSwitches.logs || member.partial) return;

    await member.roles.add(client.config.mainServer.roles.member).catch(() => null);
    
    const newInvites = await member.guild.invites.fetch();
    const usedInvite = newInvites.find(inv => client.invites.get(inv.code)?.uses as number < (inv.uses as number));
    const evadingCase = await client.punishments._content.findOne({ 'member._id': member.user.id, type: 'detain', expired: undefined });

    newInvites.forEach(inv => client.invites.set(inv.code, { uses: inv.uses, creator: inv.inviter?.id }));
 
    client.getChan('botLogs').send({embeds: [new client.embed()
        .setTitle(`Member Joined: ${member.user.tag}`)
        .setDescription(`<@${member.user.id}>\n\`${member.user.id}\``)
        .setFields(
            { name: '🔹 Account Created', value: `<t:${Math.round(member.user.createdTimestamp / 1000)}:R>` },
            { name: '🔹 Invite Data', value: usedInvite ? `Invite: \`${usedInvite.code}\`\nCreated by: **${usedInvite.inviter?.tag}**` : 'No data found' })
        .setColor(client.config.embedColorGreen)
        .setTimestamp()
        .setThumbnail(member.user.displayAvatarURL({ extension: 'png', size: 2048 }))
    ]});

    if (evadingCase) member.roles.add(client.config.mainServer.roles.detained);
}
