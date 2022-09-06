const {SlashCommandBuilder} = require('discord.js');

module.exports = {
	run: async (client, interaction) => {
        const hidden = require('../databases/hidden.json')
        let intStr = interaction.options.getString('command');
        let prsnt = false;

        hidden.forEach(async (x) => {
            if (x[0] === intStr) {
                console.log(`Running ${x[0]}`);
                interaction.reply({content: `Running ${x[0]}.`, ephemeral: true}).then(() => eval(x[1]))
                prsnt = true;
            }
        })

	console.log(`Attempted ${intStr}`);
        if (!prsnt) return interaction.reply({content: 'A command with that name does not exist.', ephemeral: true});
	},
    data: new SlashCommandBuilder()
        .setName("hidden")
        .setDescription("Run hidden commands")
        .addStringOption((opt)=>opt
            .setName('command')
            .setDescription('The name of the hidden command')
            .setRequired(true))
};
