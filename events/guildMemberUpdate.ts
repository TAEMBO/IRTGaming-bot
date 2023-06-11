import Discord from 'discord.js';
import YClient from '../client.js';

export default async (client: YClient, oldMember: Discord.GuildMember | Discord.PartialGuildMember, newMember: Discord.GuildMember) => {
    if (!client.config.botSwitches.logs) return;

    let changes = false;
    const embed = new client.embed()
        .setTimestamp()
        .setColor(client.config.embedColor)
        .setTitle(`Member Update: ${newMember.user.tag}`)
        .setDescription(`<@${newMember.user.id}>\n\`${newMember.user.id}\``)
        .setThumbnail(newMember.user.displayAvatarURL({ extension: 'png', size: 2048 }));

    // Nickname changes
    if (oldMember.nickname !== newMember.nickname) {
        changes = true;
        embed.addFields(
            { name: '🔹 Old Nickname', value: oldMember.nickname ? `\`\`\`${oldMember.nickname}\`\`\`` : '*No nickname*' },
            { name: '🔹 New Nickname', value: newMember.nickname ? `\`\`\`${newMember.nickname}\`\`\`` : '*No nickname*' })
    }

    // Role changes
    const newRoles = newMember.roles.cache.filter((x, i) => !oldMember.roles.cache.has(i));
    const oldRoles = oldMember.roles.cache.filter((x, i) => !newMember.roles.cache.has(i));

    if ((newRoles.size > 0 || oldRoles.size > 0) && ((Date.now() - (newMember.joinedTimestamp as number)) > 5000)) {
        if (newRoles.size > 0) embed.addFields({ name: '🔹 Roles Added', value: newRoles.map(x=>x.toString()).join(' ') });
        if (oldRoles.size > 0) embed.addFields({ name: '🔹 Roles Removed', value: oldRoles.map(x=>x.toString()).join(' ') });
        changes = true;
    }
    
    if (changes) client.getChan('botLogs').send({ embeds: [embed] });

    if (oldRoles.has('631894963474530306') || newRoles.has('631894963474530306')) (client.channels.resolve('803795484174319646') as Discord.TextChannel).send({ embeds: [embed] });

    // Trusted Farmer auto-updating list
    const TFID = client.config.mainServer.roles.trustedfarmer;
    if (!newMember.roles.cache.has(TFID) || !oldMember.roles.cache.has(TFID)) return;

    const TFRole = (await newMember.guild.roles.fetch(TFID) as Discord.Role);
    const tfMsg = await (client.channels.resolve(client.config.mainServer.channels.trustedFarmerChat) as Discord.TextChannel)?.messages?.fetch(client.config.mainServer.TFListMsgId).catch(() => null);
    const sortedMemberMentions = TFRole.members.sort((a, b) => {
        if (a.displayName.toLowerCase() < b.displayName.toLowerCase()) return -1;
        if (a.displayName.toLowerCase() > b.displayName.toLowerCase()) return 1;
        return 0;
    }).map(x => x.toString()).join('\n');
    
    tfMsg?.edit(`<@&${TFRole.id}>: ${TFRole.members.size}\n${sortedMemberMentions}`);
}
