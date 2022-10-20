module.exports = {
    name: "interactionCreate",
    execute: async (client, interaction) => {
        if (interaction.isCommand()) {
            const commandFile = client.commands.get(interaction.commandName);
            if (!client.config.botSwitches.commands && !client.config.devWhitelist.includes(interaction.user.id)) return interaction.reply({content: 'Commands are currently disabled.', ephemeral: true});
            if (commandFile) {
                if (commandFile.disabled) return interaction.reply({content: 'This command is disabled.', ephemeral: true});
                console.log(`\x1b[36m[${client.moment().format('HH:mm:ss')}]`, `\x1b[32m${interaction.user.tag}\x1b[36m used \x1b[32m/${interaction.commandName} ${interaction.options._subcommand ?? ''}\x1b[36m in \x1b[32m#${interaction.channel.name}`);
                try {
                    commandFile.run(client, interaction);
                    commandFile.uses ? commandFile.uses++ : commandFile.uses = 1;
                } catch (error) {
                    console.log(`\x1b[31mAn error occured while running command "${commandFile.name}"`, error, error.stack);
                    return interaction.reply("An error occured while executing that command.");
                }
            }
        }
   }
}
