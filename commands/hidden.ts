import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
import fs from 'node:fs';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const hidden: Array<Array<string>> = JSON.parse(fs.readFileSync('./databases/hidden.json', 'utf8'));
        const command = interaction.options.getString('command', true);
        const hiddenCmd = hidden.find(x => x[0] == command);

        if (hiddenCmd) {
            console.log(client.timeLog('\x1b[33m'), `Running "${hiddenCmd[0]}"`);
            interaction.reply({content: `Running ${hiddenCmd[0]}.`, ephemeral: true}).then(() => eval(hiddenCmd[1]));
        } else {
            console.log(client.timeLog('\x1b[33m'), `Attempted "${command}"`);
            interaction.reply({content: 'A command with that name does not exist.', ephemeral: true});
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
