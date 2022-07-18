const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = { 
    run: async (client, interaction, user) => {
        const channel = client.channels.resolve('811341461223112714');

        interaction.reply({content: 'https://forms.gle/JivS14vJgcJCKigq7', ephemeral: true})
        channel.send(`<@${interaction.user.id}> (${interaction.user.tag}) opened an MP Staff application at <t:${Math.round(Date.now() / 1000)}>\nForm: <https://forms.gle/JivS14vJgcJCKigq7>`)
    },
    data: new SlashCommandBuilder()
        .setName("apply")
        .setDescription("Apply for MP Staff")
};