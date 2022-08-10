const {SlashCommandBuilder} = require('discord.js');
module.exports = {
    run: async (client, interaction) => {
        if (interaction.member.roles.cache.has(client.config.mainServer.roles.mod)) {
            // credits to Skippy for this
            const role = client.config.mainServer.id;
            const perms = role.permissions.toArray()

            perms.push("SEND_MESSAGES")
            await role.edit({ permissions: perms });
            interaction.reply('Unfroze server')     
            
        } else {
            client.yOuNeEdMoD(client, interaction);
        }
    },
    data: new SlashCommandBuilder()
        .setName("unfreeze")
        .setDescription("Unlock the server for causals.")
};