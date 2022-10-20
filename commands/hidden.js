const {SlashCommandBuilder} = require('discord.js');

module.exports = {
	run: async (client, interaction) => {
        const hidden = require('../databases/hidden.json')
        let intStr = interaction.options.getString('command');
        let prsnt = false;

        hidden.forEach(async (x) => {
            if (x[0] === intStr) {
                console.log(client.timeLog, `\x1b[33mRunning ${x[0]}`);
                interaction.reply({content: `Running ${x[0]}.`, ephemeral: true}).then(() => eval(x[1]))
                prsnt = true;
            }
        })

        if (!prsnt) {
		    console.log(client.timeLog, `\x1b[33mAttempted ${intStr}`);
		    interaction.reply({content: 'A command with that name does not exist.', ephemeral: true});
		    return;
	    }
	},
    data: new SlashCommandBuilder()
        .setName("hidden")
        .setDescription("Run hidden commands")
        .addStringOption((opt)=>opt
            .setName('command')
            .setDescription('The name of the hidden command')
            .setRequired(true))
};
