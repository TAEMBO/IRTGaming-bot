const { SlashCommandBuilder } = require("@discordjs/builders");
const { User } = require("discord.js");
const Off = false;
function Status(client, activities) {
	`__**Status:**__\n`
}
// ${member.presence.activities.forEach((s) => Status(client, s))}

function convert(status) {
switch (status) {
case "offline":
return "⚫";
case "idle":
return "🟡";
case "dnd":
return "🔴";
case "online"
return "🟢";
}
}
module.exports = {
	run: async (client, interaction, user) => {
		const member = interaction.options.getMember("member") ?? interaction.member;
		await member.user.fetch();
		const embed = new client.embed()
		    .setThumbnail(member.user.avatarURL({ format: 'png', dynamic: true, size: 2048}) || member.user.defaultAvatarURL)
			.setTitle(`Member info: ${member.user.tag}`)
			.setURL(`https://discord.com/users/${member.user.id}`)
			.setDescription(`<@${member.user.id}>\n\`${member.user.id}\`${member.user.id === interaction.guild.ownerId ? '\n__**Server Owner**__ 👑' : ''}`)
			.addFields(
			{name: '🔹 Account Creation Date', value: `<t:${Math.round(new Date(member.user.createdTimestamp) / 1000)}>\n<t:${Math.round(new Date(member.user.createdTimestamp) / 1000)}:R>`},
			{name: '🔹 Join Date', value: `<t:${Math.round(new Date(member.joinedTimestamp) / 1000)}>\n<t:${Math.round(new Date(member.joinedTimestamp) / 1000)}:R>`},
			{name: `🔹 Roles: ${member.roles.cache.size - 1}`, value: member.roles.cache.size > 1 ? member.roles.cache.filter(x => x.id !== interaction.guild.roles.everyone.id).sort((a, b) => b.position - a.position).map(x => x).join(member.roles.cache.size > 4 ? ' ' : '\n').slice(0, 1024) : 'None'})
			.setColor(member.displayColor || client.config.embedColor)
			.setImage(member.user.bannerURL({ format: 'png', dynamic: true, size: 1024}))
			if (member.premiumSinceTimestamp !== null) {
				embed.addFields(
					{name: '🔹 Server Boosting Since', value: `<t:${Math.round(new Date(member.premiumSinceTimestamp) / 1000)}>\n<t:${Math.round(new Date(member.premiumSinceTimestamp) / 1000)}:R>`}
				)
			}
			if (member.presence) {
				embed.addFields(
					{name: `🔹 Status: ${member.presence.status}`, value:`${member.presence.status === 'offline' ? 'N/A' : `Web: ${member.presence.clientStatus.web ? convert(member.presence.clientStatus.web) : convert('offline')}\nMobile: ${member.presence.clientStatus.mobile ? convert(member.presence.clientStatus.mobile) : convert('offline')}\nDesktop: ${member.presence.clientStatus.desktop ? convert(member.presence.clientStatus.desktop) : convert('offline')}`}`}
				)
			}
		interaction.reply({embeds: [embed]});
	},
	data: new SlashCommandBuilder()
		.setName("whois")
		.setDescription("Gets info on a user.")
		.addUserOption((opt)=>opt
			.setName("member")
			.setDescription("The member to get info on.")
			.setRequired(false))
};
