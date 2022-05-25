const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
	run: (client, interaction) => {
        if (!client.isMPStaff(client, interaction.member)) return interaction.reply({content: `You need the <@&${client.config.mainServer.roles.mpstaff}> role to use this command`, allowedMentions: {roles: false}})
        if (!interaction.member.roles.cache.has(client.config.mainServer.roles.loa)) {
            interaction.member.setNickname(`[LOA] ${interaction.member.nickname}`);
            interaction.member.roles.add(client.config.mainServer.roles.loa);
            interaction.member.roles.remove(client.config.mainServer.roles.mpstaff);
            interaction.reply({content: 'LOA status set', ephemeral: true});
        } else {
            interaction.member.setNickname(`${interaction.member.nickname.replaceAll('[LOA] ', '')}`);
            interaction.member.roles.add(client.config.mainServer.roles.mpstaff);
            interaction.member.roles.remove(client.config.mainServer.roles.loa);
            interaction.reply({content: 'LOA status removed', ephemeral: true});
        }
	},
	data: new SlashCommandBuilder().setName("loa").setDescription("Set yourself as LOA")
};