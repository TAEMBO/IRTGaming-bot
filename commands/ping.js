const {SlashCommandBuilder} = require('discord.js');

module.exports = { 
    run: async (client, interaction) => {
        const msg = await interaction.reply({content: "Pinging...", fetchReply: true});
        const time = msg.createdTimestamp - interaction.createdTimestamp; msg.edit({content: `Websocket: \`${client.ws.ping}\`ms\nBot: \`${time}\`ms`});
    },
    data: new SlashCommandBuilder().setName("ping").setDescription("Get the bot's latency")
};