import Discord from 'discord.js';
import YClient from '../client.js';
import { log } from '../utilities.js';
import { Command, LogColor } from '../typings.js';

export default async (client: YClient, interaction: Discord.Interaction<Discord.CacheType>) => {
    if (!interaction.inGuild() || !interaction.inCachedGuild()) return;

    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'ping') return interaction.reply({ content: 'Pinging...', fetchReply: true }).then(msg => msg.edit(`Websocket: \`${client.ws.ping}\`ms\nBot: \`${msg.createdTimestamp - interaction.createdTimestamp}\`ms`));
        
        const subCmd = interaction.options.getSubcommand(false);
        const command = client.commands.get(interaction.commandName) as Command;

        log(LogColor.White, `\x1b[32m${interaction.user.tag}\x1b[37m used \x1b[32m/${interaction.commandName} ${subCmd ?? ''}\x1b[37m in \x1b[32m#${interaction.channel?.name}`);
        if (!client.config.botSwitches.commands && !client.config.devWhitelist.includes(interaction.user.id)) return interaction.reply('Commands are currently disabled.');

        command.commandFile.default.run(client, interaction);
        command.uses++
    } else if (interaction.isButton()) {
        if (interaction.customId.startsWith('reaction-') && client.config.botSwitches.buttonRoles) { // Button roles
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
                    interaction.guild.members.cache.get(args[1])?.roles.add(client.config.mainServer.roles.subscriber);
                    interaction.message.edit({ content: interaction.message.content + '\n**Accepted verification**', components: [] });
                },
                no: () => {
                    interaction.message.edit({ content: interaction.message.content + '\n**Denied verification**', components: [] });
                }
            } as any)[args[0]]();
        } else log(LogColor.Purple, `Alternate button pressed at ${interaction.message.url}`);
    }
}
