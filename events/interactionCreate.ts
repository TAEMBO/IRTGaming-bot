import Discord from 'discord.js';
import { log } from '../utilities.js';
import { Command, TClient } from '../typings.js';

export default async (interaction: TClient<Discord.Interaction<"cached">>) => {
    if (!interaction.inGuild() || !interaction.inCachedGuild()) return;

    interaction.client.config.mainServer.roles.detained
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'ping') return interaction.reply({ content: 'Pinging...', fetchReply: true }).then(msg => msg.edit(`Websocket: \`${interaction.client.ws.ping}\`ms\nBot: \`${msg.createdTimestamp - interaction.createdTimestamp}\`ms`));
        
        const subCmd = interaction.options.getSubcommand(false);
        const command = interaction.client.commands.get(interaction.commandName) as Command;

        log('White', `\x1b[32m${interaction.user.tag}\x1b[37m used \x1b[32m/${interaction.commandName} ${subCmd ?? ''}\x1b[37m in \x1b[32m#${interaction.channel?.name}`);
        if (!interaction.client.config.botSwitches.commands && !interaction.client.config.devWhitelist.includes(interaction.user.id)) return interaction.reply('Commands are currently disabled.');

        command.run(interaction);
        command.uses++;
    } else if (interaction.isButton()) {
        if (interaction.customId.startsWith('reaction-') && interaction.client.config.botSwitches.buttonRoles) { // Button roles
            const RoleID = interaction.customId.replace('reaction-', '');

            if (interaction.member.roles.cache.has(RoleID)) {
                interaction.member.roles.remove(RoleID);
                interaction.reply({ content: `You've been removed from <@&${RoleID}>`, ephemeral: true });
            } else {
                interaction.member.roles.add(RoleID);
                interaction.reply({ content: `You've been added to <@&${RoleID}>`, ephemeral: true });
            }
        } else if (interaction.customId.startsWith('sub-')) { // Subscriber role verification
            const args = interaction.customId.replace('sub-', '').split('-');

            ({
                yes: () => {
                    interaction.guild.members.cache.get(args[1])?.roles.add(interaction.client.config.mainServer.roles.subscriber);
                    interaction.message.edit({ content: interaction.message.content + '\n**Accepted verification**', components: [] });
                },
                no: () => {
                    interaction.message.edit({ content: interaction.message.content + '\n**Denied verification**', components: [] });
                }
            } as any)[args[0]]();
        } else log('Purple', `Alternate button pressed at ${interaction.message.url}`);
    }
}
