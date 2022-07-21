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
		case "online":
			return "🟢";
	}
}
module.exports = {
	run: async (client, interaction, user) => {
		const subCmd = interaction.options.getSubcommand();

		switch (subCmd) {
			case 'member':
				const member = interaction.options.getMember("member") ?? interaction.member;
				await member.user.fetch();
				const embed0 = new client.embed()
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
							{name: '🔹 Server Boosting Since', value: `<t:${Math.round(new Date(member.premiumSinceTimestamp) / 1000)}>\n<t:${Math.round(new Date(member.premiumSinceTimestamp) / 1000)}:R>`, inline: true}
						)
					}
					if (member.presence) {
						embed.addFields(
							{name: `🔹 Status: ${member.presence.status}`, value:`${member.presence.status === 'offline' ? 'N/A' : `Web: ${member.presence.clientStatus.web ? convert(member.presence.clientStatus.web) : convert('offline')}\nMobile: ${member.presence.clientStatus.mobile ? convert(member.presence.clientStatus.mobile) : convert('offline')}\nDesktop: ${member.presence.clientStatus.desktop ? convert(member.presence.clientStatus.desktop) : convert('offline')}`}`, inline: true}
						)
					}
				interaction.reply({embeds: [embed0]});
			case 'user':
				const User = await client.users.fetch(interaction.options.getString("user"), [force = true]).catch((e) => interaction.reply('A user with that ID could not be found.'));

				const embed1 = new client.embed()
					.setThumbnail(User.avatarURL({ format: 'png', dynamic: true, size: 2048}) || User.defaultAvatarURL)
					.setTitle(`User info: ${User.tag}`)
					.setURL(`https://discord.com/users/${User.id}`)
					.setDescription(`<@${User.id}>\n\`${User.id}\``)
					.addFields(
					{name: '🔹 Account Creation Date', value: `<t:${Math.round(new Date(User.createdTimestamp) / 1000)}>\n<t:${Math.round(new Date(User.createdTimestamp) / 1000)}:R>`})
					.setColor(client.config.embedColor)
					.setImage(User.bannerURL({ format: 'png', dynamic: true, size: 1024}))
				interaction.reply({embeds: [embed1]});
		}
	},
	data: new SlashCommandBuilder()
		.setName("whois")
		.setDescription("Get info on a member or user.")
		.addSubcommand((optt)=>optt
			.setName('member')
			.setDescription('Get info on a member.')
			.addUserOption((opt)=>opt
				.setName("member")
				.setDescription("The member to get info on.")
				.setRequired(false)))
		.addSubcommand((optt)=>optt
			.setName('user')
			.setDescription('Get info on a user')
			.addStringOption((opt)=>opt
				.setName("user")
				.setDescription("The ID of the user.")
				.setRequired(true)))
};