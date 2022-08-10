const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    run: async (client, interaction) => {
        const subCmd = interaction.options.getSubcommand();

        if (subCmd === 'verify') {
            const channel = client.channels.resolve('849993619267911680');
            const pic = interaction.options.getAttachment('image');

            channel.send({content: `<@${interaction.user.id}> (${interaction.user.tag}) <@&${client.config.mainServer.roles.subscriber}> role verification`, files: [pic], allowedMentions: {roles: false}})
            interaction.reply({content: `Verification sent, please wait for someone to verify your subscription. You will then receive the <@&${client.config.mainServer.roles.subscriber}> role.`, ephemeral: true})
        } else if (subCmd === 'accept') {
            if (!client.hasModPerms(client, interaction.member)) return client.yOuNeEdMoD(client, interaction);
            const member = interaction.options.getMember("member");

            member.roles.add(client.config.mainServer.roles.subscriber)
            interaction.reply(`Role added to <@${member.user.id}>`)
        }
      },
    data: new SlashCommandBuilder()
    .setName("sub")
    .setDescription("Pull from GitHub repository to live bot")
    .addSubcommand((optt)=>optt
        .setName("verify")
        .setDescription("Verify your YT subscription to IRT")
        .addAttachmentOption(option => option
            .setName('image')
            .setDescription('Image proving subscription')
            .setRequired(true))
    )
    .addSubcommand((optt)=>optt
    .setName("accept")
    .setDescription("Staff only: accept a verification")
    .addUserOption((opt)=>opt
        .setName("member")
        .setDescription("The member to add the role to")
        .setRequired(true))
)
};
