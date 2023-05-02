import Discord from 'discord.js';
import YClient from '../client.js';

export default async (client: YClient, interaction: Discord.BaseInteraction) => {
    if (!interaction.inGuild() || !interaction.inCachedGuild() || !interaction.channel) return;

    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'ping') return interaction.reply({ content: 'Pinging...', fetchReply: true }).then(msg => msg.edit(`Websocket: \`${client.ws.ping}\`ms\nBot: \`${msg.createdTimestamp - interaction.createdTimestamp}\`ms`));
        
        const subCmd = interaction.options.getSubcommand(false);
        const commandFile = client.commands.get(interaction.commandName);

        client.log('\x1b[37m', `\x1b[32m${interaction.user.tag}\x1b[37m used \x1b[32m/${interaction.commandName} ${subCmd ?? ''}\x1b[37m in \x1b[32m#${interaction.channel.name}`);
        if (!client.config.botSwitches.commands && !client.config.devWhitelist.includes(interaction.user.id)) return interaction.reply('Commands are currently disabled.');

        commandFile.commandFile.default.run(client, interaction);
        commandFile.uses ? commandFile.uses++ : commandFile.uses = 1;
    } else if (interaction.isButton()) {
        if (interaction.customId.startsWith('reaction-') && client.config.botSwitches.buttonRoles) { // Button roles
            const RoleID = interaction.customId.replace('reaction-', '');

            if (interaction.member.roles.cache.has(RoleID)) {
                interaction.member.roles.remove(RoleID);
                interaction.reply({content: `You've been removed from <@&${RoleID}>`, ephemeral: true});
            } else {
                interaction.member.roles.add(RoleID);
                interaction.reply({content: `You've been added to <@&${RoleID}>`, ephemeral: true});
            }
        } else if (interaction.customId.startsWith('sub-')) { // Subscriber role verification
            const args = interaction.customId.replace('sub-', '').split('-');

            if (args[0] === 'yes') {
                interaction.guild.members.cache.get(args[1])?.roles.add(client.config.mainServer.roles.subscriber);
                interaction.reply('Accepted verification');
                interaction.message.edit({components: []});
            } else {
                interaction.reply('Denied verification');
                interaction.message.edit({components: []});
            }
        } else client.log('\x1b[35m', `Alternate button pressed at ${interaction.message.url}`);
    }
}
