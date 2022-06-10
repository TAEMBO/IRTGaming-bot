const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    run: async (client, interaction) => {
        if (!client.config.eval.whitelist.includes(interaction.user.id)) return interaction.reply({content: `You're not allowed to use this command.`})
        const msg = await interaction.reply({content: "Pulling from repo...", allowedMentions: {repliedUser: false}, fetchReply: true});
        require("child_process").exec("git pull")

        const options = interaction.options.getString('options');

        switch (options) {
          case 'ur':
            msg.edit({content: "Restarting..."}).then(async ()=> eval(process.exit(-1)));
            return
          case 'u':
            msg.edit({content: "Pulled from repo"});
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
