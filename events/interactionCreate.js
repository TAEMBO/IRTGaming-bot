const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

module.exports = {
    name: "interactionCreate",
    giveaway: false,
    tracker: false,
    frs: false,
    execute: async (client, interaction) => {
        if(interaction.isButton()){
        if(interaction.customId.startsWith("reaction-") && client.config.botSwitches.reactionRoles){
        await interaction.deferUpdate();
        const role = `${interaction.customId}`.replace("reaction-", "");
    if(!interaction.member.roles.cache.has(role)){
        interaction.member.roles.add(role).catch((e)=>{return});
    } else {
        interaction.member.roles.remove(role).catch((e)=>{return});
        }
   }
   } else if(interaction.isCommand()){
    const commandFile = client.commands.get(interaction.commandName);
    if(client.config.botSwitches.commands === false) return;
    if (commandFile) {
        if(commandFile.disabled) return interaction.reply({content: 'This command is disabled.', ephemeral: true});
        console.log(`${interaction.user.tag} used /${interaction.commandName} in ${interaction.channel.name}`);

        try {
            commandFile.run(client, interaction);
            commandFile.uses ? commandFile.uses++ : commandFile.uses = 1;
        } catch (error) {
            console.log(`An error occured while running command "${commandFile.name}"`, error, error.stack);
            return interaction.reply("An error occured while executing that command.");
        }
    }
   }
   }
}