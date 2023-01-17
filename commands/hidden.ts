import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
import path from 'node:path';
import fs from 'node:fs';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const hidden: Array<Array<string>> = JSON.parse(fs.readFileSync(path.join(__dirname, '../databases/hidden.json'), 'utf8'));
        let command = interaction.options.getString('command');
        const cmdExists = hidden.find((x) => x[0] == command);

        if (cmdExists) {
            console.log(`[${client.moment().format('HH:mm:ss')}]`, `Running "${cmdExists[0]}"`);
            interaction.reply({content: `Running ${cmdExists[0]}.`, ephemeral: true}).then(() => eval(cmdExists[1]));
        } else {
            console.log(`[${client.moment().format('HH:mm:ss')}]`, `Attempted "${command}"`);
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
