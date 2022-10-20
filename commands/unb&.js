const {SlashCommandBuilder} = require('discord.js');
module.exports = {
    run: (client, interaction) => {        
        const member = interaction.options.getUser("user");
        if (interaction.member.id == '769710040596217897') return;
        interaction.reply({content: "ok", ephemeral: true})
        if(!member){
            return interaction.channel.send({content: `Your honorary ban has been revoked!`});
        } else {
            return interaction.channel.send({content: `<@${member.id}> had their honorary ban revoked!`})}
    },
    data: new SlashCommandBuilder()
        .setName("unband")
        .setDescription("Revokes an honorary ban.")
        .addUserOption((opt)=>opt
            .setName("user")
            .setDescription("It's an honor")
            .setRequired(false))
};
