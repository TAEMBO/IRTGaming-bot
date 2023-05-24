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
    
    if (changes) (client.channels.resolve(client.config.mainServer.channels.botLogs) as Discord.TextChannel).send({ embeds: [embed] });

    if (oldRoles.has('631894963474530306') || newRoles.has('631894963474530306')) (client.channels.resolve('803795484174319646') as Discord.TextChannel).send({ embeds: [embed] });

    // Trusted Farmer auto-updating list
    const mpTf = (await newMember.guild.roles.fetch(client.config.mainServer.roles.trustedfarmer) as Discord.Role);
    const tfList = `<@&${mpTf.id}>: ${mpTf.members.size}\n${mpTf.members.map(e=>e.toString()).join("\n")}`;
    const tfMsg = await (client.channels.resolve('718555644801712200') as Discord.TextChannel)?.messages?.fetch('980240957167521863').catch(() => null);
    if (tfMsg && tfMsg.content !== tfList) tfMsg.edit(tfList);
}
