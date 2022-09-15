const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    run: async (client, interaction) => {
        if (!client.config.eval.whitelist.includes(interaction.user.id)) return interaction.reply({content: `You're not allowed to use this command.`})
        const msg = await interaction.reply({content: "Pulling from repo...", fetchReply: true});
        require("child_process").exec("git pull");
        setTimeout(()=> {msg.edit({content: 'Restarting...'}).then(()=> eval(process.exit(-1)))}, 1000)
    },
    data: new SlashCommandBuilder()
        .setName("update")
        .setDescription("Pull from GitHub repository to live bot")
};
