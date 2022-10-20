const {SlashCommandBuilder, ActionRowBuilder, ButtonBuilder} = require('discord.js');
module.exports = {
    run: async (client, interaction) => {
        const suggestion = interaction.options.getString("suggestion");
        if (interaction.channel.id !== client.config.mainServer.channels.suggestions) {
            return interaction.reply({content: `This command only works in <#${client.config.mainServer.channels.suggestions}>`, ephemeral: true});
        }
        const embed = new client.embed()
            .setAuthor({name: `${interaction.member.displayName} (${interaction.user.id})`, iconURL: interaction.user.displayAvatarURL({ format: 'png', size: 128 })})
            .setTitle(`Community Idea:`)
            .setDescription(suggestion)
            .setTimestamp()
            .setColor(client.config.embedColor)
            interaction.reply({embeds: [embed], fetchReply: true}).then((msg)=> {
                msg.react('✅');
                msg.react('❌');
            });
    },
    data: new SlashCommandBuilder()
        .setName("suggest")
        .setDescription("Create a suggestion.")
        .addStringOption((opt)=>opt
            .setName("suggestion")
            .setDescription("Your suggestion.")
            .setRequired(true))
}; 