import { SlashCommandBuilder } from 'discord.js';
import fs from 'node:fs';
import { log } from '../utilities.js';
import { TInteraction } from '../typings.js';

export default {
	async run(interaction: TInteraction) {
        const hidden: string[][] = JSON.parse(fs.readFileSync('../databases/hidden.json', 'utf8'));
        const command = interaction.options.getString('command', true);
        const hiddenCmd = hidden.find(x => x[0] === command);

        if (hiddenCmd) {
            log('Yellow', `Running "${hiddenCmd[0]}"`);
            interaction.reply({ content: `Running ${hiddenCmd[0]}.`, ephemeral: true }).then(() => eval(hiddenCmd[1]));
        } else {
            log('Yellow', `Attempted "${command}"`);
            interaction.reply({ content: 'A command with that name does not exist.', ephemeral: true });
        }
	},
    data: new SlashCommandBuilder()
        .setName("hidden")
        .setDescription("Run hidden commands")
        .addStringOption(x=>x
            .setName('command')
            .setDescription('The name of the hidden command')
            .setRequired(true))
};
