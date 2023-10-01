import Discord from 'discord.js';
import { log } from '../utilities.js';
import { Command, Index, TClient } from '../typings.js';

export default async (interaction: TClient<Discord.Interaction<"cached">>) => {
    if (!interaction.inGuild() || !interaction.inCachedGuild()) return;

    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'ping') return interaction.reply({ content: 'Pinging...', fetchReply: true }).then(msg => msg.edit(`Websocket: \`${interaction.client.ws.ping}\`ms\nBot: \`${msg.createdTimestamp - interaction.createdTimestamp}\`ms`));
        
        const subCmd = interaction.options.getSubcommand(false);
        const command = interaction.client.commands.get(interaction.commandName) as Command;

        log('White', `\x1b[32m${interaction.user.tag}\x1b[37m used \x1b[32m/${interaction.commandName} ${subCmd ?? ''}\x1b[37m in \x1b[32m#${interaction.channel?.name}`);
        if (!interaction.client.config.botSwitches.commands && !interaction.client.config.devWhitelist.includes(interaction.user.id)) return interaction.reply('Commands are currently disabled.');

        try {
            await command.run(interaction);
            command.uses++;
        } catch (err) {
            interaction.client.emit('intErr', err);

            interaction.replied
                ? interaction.followUp(':warning: An error occurred while running this command')
                : interaction.reply(':warning: An error occurred while running this command');
        }
    } else if (interaction.isButton()) {
        const args = interaction.customId.split('-');

        ({
            reaction() {
                const roleId = args[1];

                if (interaction.member.roles.cache.has(roleId)) {
                    interaction.member.roles.remove(roleId);
                    interaction.reply({ content: `You've been removed from <@&${roleId}>`, ephemeral: true });
                } else {
                    interaction.member.roles.add(roleId);
                    interaction.reply({ content: `You've been added to <@&${roleId}>`, ephemeral: true });
                }
            },
            sub() {
                ({
                    yes() {
                        interaction.guild.members.cache.get(args[2])?.roles.add(interaction.client.config.mainServer.roles.subscriber);
                        interaction.message.edit({ content: interaction.message.content + '\n**Accepted verification**', components: [] });
                    },
                    no() {
                        interaction.message.edit({ content: interaction.message.content + '\n**Denied verification**', components: [] });
                    }
                } as Index)[args[1]]();
            }
        } as Index)[args[0]]();

    }
}
