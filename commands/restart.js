const {SlashCommandBuilder} = require("@discordjs/builders");
module.exports = {
  run: (client, interaction) => {
    if (!client.config.eval.whitelist.includes(interaction.user.id)) return interaction.reply({content: `You're not allowed to use this command.`, allowedMentions: {roles: false}});
    interaction.reply("Restarting...");
    client.channels.cache.get(client.config.mainServer.channels.modlogs).send({embeds: [new client.embed().setDescription(`**Restart issued by ${interaction.user.tag}** \`${interaction.user.id}\``).setColor(client.config.embedColor).setTimestamp()]}).then(async ()=> eval(process.exit(-1)))
  },
  data: new SlashCommandBuilder().setName("restart").setDescription("Restarts the bot.")
};
