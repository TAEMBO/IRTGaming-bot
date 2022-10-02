const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    run: (client, interaction) => {
        const member = interaction.options.getUser("user");
        if (interaction.member.id == '769710040596217897') return;
        interaction.reply({content: "ok", ephemeral: true});
        if (!member) {
            interaction.channel.send('You received an honorary ban!')
            return;
        } else {
            interaction.channel.send(`<@${member.id}> has received an honorary ban!`)}
        return;
    },
    data: new SlashCommandBuilder()
        .setName("band")
        .setDescription("Honorary ban")
        .addUserOption((opt)=>opt
            .setName("user")
            .setDescription(".")
            .setRequired(false))
};
