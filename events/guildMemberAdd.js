const Discord = require("discord.js");
module.exports = {
    name: "guildMemberAdd",
    execute: async (client, member) => {
        if (member.partial) return;

        const index = member.guild.memberCount;
        const suffix = ((index) => {
            const numbers = index.toString().split('').reverse(); // eg. 1850 -> [0, 5, 8, 1]
            if (numbers[1] === '1') { // this is some -teen
                return 'th';
            } else {
                if (numbers[0] === '1') return 'st';
                else if (numbers[0] === '2') return 'nd';
                else if (numbers[0] === '3') return 'rd';
                else return 'th';
            }
        })(index);

        const embed0 = new client.embed()
            .setTitle(`Welcome, ${member.user.tag}!`)
            .setColor(client.config.embedColor)
            .setThumbnail(member.user.avatarURL({ format: 'png', dynamic: true, size: 2048}) || member.user.defaultAvatarURL)
            .setDescription(`Please familiarize yourself with our <#552590507352653827> and head over to <#922631314195243080> to gain access to more channels & receive notification about community news.`)
            .addFields({name: 'Useful channels', value: `Our game servers: <#739100711073218611>\nReport players: <#825046442300145744>\nCome chat with us!: <#552565546093248512>`})
            .setFooter({text: `${index}${suffix} member`})
        client.channels.resolve(client.config.mainServer.channels.welcome).send({content: `<@${member.user.id}>`, embeds: [embed0]})

        if (!client.config.botSwitches.logs) return;
        const oldInvites = client.invites;
        const newInvites = await member.guild.invites.fetch();
        const usedInvite = newInvites.find(inv => oldInvites.get(inv.code)?.uses < inv.uses);
        newInvites.forEach(inv => client.invites.set(inv.code, {uses: inv.uses, creator: inv.inviter.id}));
 
         const embed1 = new client.embed()
            .setTitle(`Member Joined: ${member.user.tag}`)
            .setDescription(`<@${member.user.id}>\n\`${member.user.id}\``)
            .addFields(
            {name: '🔹 Account Creation Date', value: `<t:${Math.round(new Date(member.user.createdTimestamp) / 1000)}>\n<t:${Math.round(new Date(member.user.createdTimestamp) / 1000)}:R>`},
            {name: '🔹Invite Data:', value: usedInvite ? `Invite: \`${usedInvite.code}\`\nCreated by: **${usedInvite.inviter.tag}**` : 'I couldn\'t find out how they joined!'})
            .setColor(client.config.embedColorGreen)
            .setTimestamp(Date.now())
            .setThumbnail(member.user.displayAvatarURL({ format: 'png', dynamic: true, size: 2048}))
         client.channels.resolve(client.config.mainServer.channels.modlogs).send({embeds: [embed1]})
 
        
    }
}
