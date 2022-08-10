const {SlashCommandBuilder} = require('discord.js');
module.exports = {
  run: (client, interaction) => {
    if (!client.config.eval.whitelist.includes(interaction.user.id)) return interaction.reply(`You're not allowed to use this command.`);
    client.channels.cache.get(client.config.mainServer.channels.modlogs).send(`**Restart issued by ${interaction.user.tag}**`)
    interaction.reply("Restarting...").then(async ()=> eval(process.exit(-1)))
  },
  data: new SlashCommandBuilder()
    .setName("restart")
    .setDescription("Restarts the bot.")
};
