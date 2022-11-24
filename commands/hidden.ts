import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const hidden = require('../databases/hidden.json')
        let intStr = interaction.options.getString('command');
        let prsnt = false;

        hidden.forEach(async (x: string) => {
            if (x[0] === intStr) {
                console.log(`[${client.moment().format('HH:mm:ss')}]`, `Running "${x[0]}"`);
                interaction.reply({content: `Running ${x[0]}.`, ephemeral: true}).then(() => eval(x[1]))
                prsnt = true;
            }
        })

        if (!prsnt) {
		    console.log(`[${client.moment().format('HH:mm:ss')}]`, `Attempted "${intStr}"`);
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
