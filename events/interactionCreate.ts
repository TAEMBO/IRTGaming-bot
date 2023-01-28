import Discord from 'discord.js';
import YClient from '../client';

export default async (client: YClient, interaction: Discord.BaseInteraction) => {
    if (!interaction.inGuild() || !interaction.inCachedGuild() || !interaction.channel) return;

    if (interaction.isChatInputCommand()) {
        let subCmd: string;
        try {
            subCmd = interaction.options.getSubcommand();
        } catch (err) {
            subCmd = '';
        }
        const commandFile = client.commands.get(interaction.commandName);
        console.log(client.timeLog('\x1b[37m'), `\x1b[32m${interaction.user.tag}\x1b[37m used \x1b[32m/${interaction.commandName} ${subCmd}\x1b[37m in \x1b[32m#${interaction.channel.name}`);
        if (!client.config.botSwitches.commands && !client.config.devWhitelist.includes(interaction.user.id)) return interaction.reply('Commands are currently disabled.');
        if (commandFile) {
            try {
                commandFile.default.run(client, interaction);
                commandFile.uses ? commandFile.uses++ : commandFile.uses = 1;
            } catch (error: any) {
                console.log(`An error occured while running command "${commandFile.name}"`, error, error.stack);
                return interaction.reply("An error occured while executing that command.");
            }
        }
    } else if (interaction.isButton()) {
        console.log(client.timeLog('\x1b[33m'), `Filler text, Button pressed at ${interaction.message.url}`);
    }
}
