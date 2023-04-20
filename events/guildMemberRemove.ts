import Discord from 'discord.js';
import YClient from '../client.js';

export default async (client: YClient, member: Discord.GuildMember) => {
    if (!client.config.botSwitches.logs || !member.joinedTimestamp) return;
        
    const rankingData = await client.userLevels._content.findById(member.id);
    const embed = new client.embed()
        .setTitle(`Member Left: ${member.user.tag}`)
        .setDescription(`<@${member.user.id}>\n\`${member.user.id}\``)
        .addFields(
            {name: '🔹 Account Creation Date', value: `<t:${Math.round(member.user.createdTimestamp / 1000)}>\n<t:${Math.round(member.user.createdTimestamp / 1000)}:R>`},
            {name: '🔹 Server Join Date', value: `<t:${Math.round(member.joinedTimestamp / 1000)}>\n<t:${Math.round(member.joinedTimestamp / 1000)}:R>`},
            {name: `🔹 Roles: ${member.roles.cache.size - 1}`, value: member.roles.cache.size > 1 ? member.roles.cache.filter(x => x.id !== member.guild.roles.everyone.id).sort((a, b) => b.position - a.position).map(x => x).join(member.roles.cache.size > 4 ? ' ' : '\n').slice(0, 1024) : 'None', inline: true})
        .setTimestamp()
        .setColor(client.config.embedColorRed)
        .setThumbnail(member.user.displayAvatarURL({ extension: 'png', size: 2048}));
    if (rankingData && rankingData.messages > 1) embed.addFields({name: '🔹 Ranking Total', value: rankingData.messages.toLocaleString('en-US'), inline: true});
    (client.channels.resolve(client.config.mainServer.channels.botLogs) as Discord.TextChannel).send({embeds: [embed]});
    (client.channels.resolve('622864143866789919') as Discord.TextChannel).send(`**${member.user.tag}** left the server.`);

    await client.userLevels._content.findByIdAndDelete(member.id);
}
