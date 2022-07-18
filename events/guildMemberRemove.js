const Discord = require("discord.js");
module.exports = {
    name: "guildMemberRemove",
    execute: async (client, member) => {
        if (!client.config.botSwitches.logs) return;

        const embed = new client.embed()
            .setTitle(`Member Left: ${member.user.tag}`)
            .setDescription(`<@${member.user.id}>\n\`${member.user.id}\``)
            .addFields(
            {name: '🔹 Account Creation Date', value: `<t:${Math.round(new Date(member.user.createdTimestamp) / 1000)}>\n<t:${Math.round(new Date(member.user.createdTimestamp) / 1000)}:R>`},
            {name: '🔹 Join Date', value: `<t:${Math.round(new Date(member.joinedTimestamp) / 1000)}>\n<t:${Math.round(new Date(member.joinedTimestamp) / 1000)}:R>`},
            {name: `🔹 Roles: ${member.roles.cache.size - 1}`, value: `${member.roles.cache.size > 1 ? member.roles.cache.filter(x => x.id !== member.guild.roles.everyone.id).sort((a, b) => b.position - a.position).map(x => x).join(member.roles.cache.size > 4 ? ' ' : '\n').slice(0, 1024) : 'None'}`, inline: true},
            {name: '🔹 Level Roles messages', value: `${await client.userLevels.getEligible(member).messages.toLocaleString('en-US')}`, inline: true})
            
            .setColor(client.config.embedColorRed)
            .setTimestamp(Date.now())
            .setThumbnail(member.user.displayAvatarURL({ format: 'png', dynamic: true, size: 2048}))
         client.channels.resolve(client.config.mainServer.channels.modlogs).send({embeds: [embed]});
         delete client.userLevels._content[member.user.id];
    }
}
