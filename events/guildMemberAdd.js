const Discord = require("discord.js");
module.exports = {
    name: "guildMemberAdd",
    giveaway: false,
    tracker: false,
    frs: false,
    execute: async (client, member) => {
        const channel = await client.channels.fetch(require("../config.json").mainServer.channels.modlogs);
        if (member.partial) return;
        const evadingCase = client.punishments._content.find(punishment => {
            if (punishment.type !== "mute") return false;
            if (punishment.member !== member.user.id) return false;
            if (punishment.expired) return false;
            if (punishment.endTime < Date.now()) return false;
            return true;
        });
        
        if (evadingCase) {
            return;
            client.punishments.addPunishment("ban", member, { reason: `mute evasion (Case #${evadingCase.id})` }, client.user.id);
        } else {
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
            const wchannel = await client.channels.fetch(client.config.mainServer.channels.welcome);
            const embed = new Discord.MessageEmbed()
            .setTitle(`Welcome to ${member.guild.name} ${member.user.tag}!`)
            .setColor(client.config.embedColor)
            .setThumbnail(member.user.avatarURL({ format: 'png', dynamic: true, size: 2048}) || member.user.defaultAvatarURL)
            .setDescription(`Please familiarize yourself with our <#552590507352653827> and head over to <#666239346239602688> to gain access to more channels & receive notification about community news.`)
            .addFields({name: 'Useful channels', value: `Our Gameservers: <#739100711073218611>\nReport Players: <#825046442300145744>\nCome chat with us!: <#552565546093248512>`})
            .setFooter({text: `${index}${suffix} member`})
            wchannel.send({content: `<@${member.user.id}>`, embeds: [embed]})

        if (!client.config.botSwitches.logs) return;
        if (member.guild.id !== client.config.mainServer.id) return;
        const oldInvites = client.invites;
        const newInvites = await member.guild.invites.fetch();
        const usedInvite = newInvites.find(inv => oldInvites.get(inv.code)?.uses < inv.uses);
        newInvites.forEach(inv => client.invites.set(inv.code, {uses: inv.uses, creator: inv.inviter.id}));
        if (!usedInvite) {
 
         const embed = new Discord.MessageEmbed()
            .setTitle(`Member Joined: ${member.user.tag}`)
            .setDescription(`<@${member.user.id}>\n\`${member.user.id}\``)
            .addFields(
            {name: '🔹 Account Creation Date', value: `<t:${Math.round(new Date(member.user.createdTimestamp) / 1000)}>\n<t:${Math.round(new Date(member.user.createdTimestamp) / 1000)}:R>`},
            {name: '🔹Invite Data:', value: `I couldn't find out how they joined!`})
            .setColor(client.config.embedColorGreen)
            .setTimestamp(Date.now())
            .setThumbnail(member.user.displayAvatarURL({ format: 'png', dynamic: true, size: 2048}))
         channel.send({embeds: [embed]})
 
     } else {
        const embed = new Discord.MessageEmbed()
            .setTitle(`Member Joined: ${member.user.tag}`)
            .setDescription(`<@${member.user.id}>\n\`${member.user.id}\``)
            .addFields(
            {name: '🔹 Account Creation Date', value: `<t:${Math.round(new Date(member.user.createdTimestamp) / 1000)}>\n<t:${Math.round(new Date(member.user.createdTimestamp) / 1000)}:R>`},
            {name: '🔹Invite Data:', value: `Invite: \`${usedInvite.code}\`\nCreated by: **${usedInvite.inviter.tag}**`})
            .setColor(client.config.embedColorGreen)
            .setTimestamp(Date.now())
            .setThumbnail(member.user.displayAvatarURL({ format: 'png', dynamic: true, size: 2048}))
         channel.send({embeds: [embed]})
        }
    }
    }
}
