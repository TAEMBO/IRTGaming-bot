const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    run: async (client, interaction) => {
        if (!client.hasModPerms(client, interaction.member) && !interaction.member.roles.cache.has(client.config.mainServer.roles.mod)) return interaction.reply({content: `You need the <@&${client.config.mainServer.roles.mod}> role to use this command.`, allowedMentions: {roles: false}})
        const msg = await interaction.reply({content: "Pulling from repo...", allowedMentions: {repliedUser: false}, fetchReply: true});
        require("child_process").exec("git pull")
        msg.edit({content: "Pulled from repo"});

        const options = interaction.options.getString('options');

        switch (options) {
          case 'ur':
            msg.edit({content: "Restarting..."}).then(async ()=> eval(process.exit(-1)));
            return
          case 'u':
            return;
        }
      },
    data: new SlashCommandBuilder()
    .setName("update")
    .setDescription("Pull from GitHub repository to live bot")
    .addStringOption((opt) => opt
      .setName('options')
      .setDescription('Restart as well?')
      .addChoices(
        {name: 'Update and restart', value: 'ur'},
        {name: 'Update', value: 'u'})
      .setRequired(true))
};
