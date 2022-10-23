const {SlashCommandBuilder} = require('discord.js')
module.exports = {
	run: (client, interaction) => {
		if (!client.hasModPerms(interaction.member)) return client.youNeedRole(interaction, "mod");
        const member = interaction.options.getMember('member')

        client.channels.resolve('855577815491280958').permissionOverwrites.edit(member.user.id, { SendMessages: false });
        interaction.reply(`<@${member.user.id}>'s perm to send messages in <#855577815491280958> has been removed`)
	},
	data: new SlashCommandBuilder()
		.setName("discount")
		.setDescription("Remove someone's ability to count in #counting")
		.addUserOption((opt)=>opt
			.setName("member")
			.setDescription("The member to give a 15% discount to")
			.setRequired(true))
};
