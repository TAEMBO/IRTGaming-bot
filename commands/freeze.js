const {SlashCommandBuilder} = require('discord.js');

module.exports = {
	run: async (client, interaction) => {
		if (interaction.member.roles.cache.has(client.config.mainServer.roles.mod)) {
            // credits to Skippy for this
            const role = client.config.mainServer.id;
            const perms = role.permissions.toArray()

            const newPerms = perms.filter((perm) => perm !== 'SEND_MESSAGES');
            await role.edit({ permissions: newPerms })
            interaction.reply('Froze server')
        
        } else {
            client.yOuNeEdMod(client, interaction);
        }
	},
    data: new SlashCommandBuilder()
        .setName("freeze")
        .setDescription("Lock the server for casuals")
};
