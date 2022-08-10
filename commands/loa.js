const {SlashCommandBuilder} = require('discord.js');

module.exports = {
	run: (client, interaction) => {
        if (!client.isMPStaff(client, interaction.member)) return interaction.reply({content: `You need the <@&${client.config.mainServer.roles.mpstaff}> role to use this command`, allowedMentions: {roles: false}})
        if (!interaction.member.roles.cache.has(client.config.mainServer.roles.loa)) {
            interaction.member.roles.add(client.config.mainServer.roles.loa);
            setTimeout(() => interaction.member.roles.remove(client.config.mainServer.roles.mpstaff), 500);
            setTimeout(() => interaction.member.setNickname(`[LOA] ${interaction.member.nickname}`).catch((e) => console.log('failed to set nickname for LOA')), 1000);
            setTimeout(() => interaction.reply({content: 'LOA status set', ephemeral: true}), 1500);
        } else {
            interaction.member.roles.add(client.config.mainServer.roles.mpstaff);
            setTimeout(() => interaction.member.roles.remove(client.config.mainServer.roles.loa), 500);
            setTimeout(() => interaction.member.setNickname(`${interaction.member.nickname.replaceAll('[LOA] ', '')}`).catch((e) => console.log('failed to set nickname for LOA')), 1000);
            setTimeout(() => interaction.reply({content: 'LOA status removed', ephemeral: true}), 1500);
        }
	},
	data: new SlashCommandBuilder()
        .setName("loa")
        .setDescription("Set yourself as LOA")
};