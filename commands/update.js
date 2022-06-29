const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    run: async (client, interaction) => {
        if (!client.config.eval.whitelist.includes(interaction.user.id)) return interaction.reply({content: `You're not allowed to use this command.`})
        const msg = await interaction.reply({content: "Pulling from repo...", fetchReply: true});
        require("child_process").exec("git pull")

        const options = interaction.options.getString('options');

        switch (options) {
          case 'ur':
            client.channels.cache.get(client.config.mainServer.channels.modlogs).send(`**Update and restart issued by ${interaction.user.tag}** \`${interaction.user.id}\``)
            msg.edit({content: "Restarting..."}).then(async ()=> eval(process.exit(-1)));
            return
          case 'u':
            client.channels.cache.get(client.config.mainServer.channels.modlogs).send(`**Update issued by ${interaction.user.tag}** \`${interaction.user.id}\``)
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
