import { Interaction } from 'discord.js';
import { log } from '../utils.js';
import { Index } from '../typings.js';

export default async (interaction: Interaction) => {
    if (!interaction.inCachedGuild()) return;

    const ERR_TEXT = ":warning: An error occurred while running this command - developers notified of issue";

    if (interaction.isChatInputCommand()) {
        const subCmd = interaction.options.getSubcommand(false);
        const command = interaction.client.chatInputCommands.get(interaction.commandName);

        if (!command) {
            await interaction.reply(ERR_TEXT);
            return log("Red", `ChatInput - missing cached command: /${interaction.commandName}`);
        }

        log('White', `\x1b[32m${interaction.user.tag}\x1b[37m used \x1b[32m/${interaction.commandName} ${subCmd ?? ''}\x1b[37m in \x1b[32m#${interaction.channel?.name}`);

        if (!interaction.client.config.toggles.commands && !interaction.client.config.devWhitelist.includes(interaction.user.id)) return await interaction.reply('Commands are currently disabled.');

        try {
            await command.run(interaction);
            command.uses++;
        } catch (err) {
            interaction.client.emit('intErr', err);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(ERR_TEXT);
            } else {
                await interaction.reply(ERR_TEXT);
            }
        }
    } else if (interaction.isContextMenuCommand()) {
        const command = interaction.client.contextMenuCommands.get(interaction.commandName);

        if (!command) {
            await interaction.reply(ERR_TEXT);
            return log("Red", `ContextMenu - missing cached command: ${interaction.commandName}`);
        }

        log('White', `\x1b[32m${interaction.user.tag}\x1b[37m used \x1b[32m${interaction.commandName}\x1b[37m in \x1b[32m#${interaction.channel?.name}`);

        if (!interaction.client.config.toggles.commands && !interaction.client.config.devWhitelist.includes(interaction.user.id)) return await interaction.reply('Commands are currently disabled.');

        try {
            await command.run(interaction);
            command.uses++;
        } catch(err) {
            interaction.client.emit('intErr', err);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(ERR_TEXT);
            } else {
                await interaction.reply(ERR_TEXT);
            }
        }
    } else if (interaction.isButton()) {
        if (!interaction.customId.includes('-')) return;

        const args = interaction.customId.split('-');

        await ({
            async reaction() {
                const roleId = args[1];

                if (interaction.member.roles.cache.has(roleId)) {
                    await interaction.member.roles.remove(roleId);
                    await interaction.reply({ content: `You've been removed from <@&${roleId}>`, ephemeral: true });
                } else {
                    await interaction.member.roles.add(roleId);
                    await interaction.reply({ content: `You've been added to <@&${roleId}>`, ephemeral: true });
                }
            },
            async sub() {
                await ({
                    async yes() {
                        await interaction.guild.members.cache.get(args[2])?.roles.add(interaction.client.config.mainServer.roles.subscriber);
                        await interaction.message.edit({ content: interaction.message.content + '\n**Accepted verification**', components: [] });
                    },
                    async no() {
                        await interaction.message.edit({ content: interaction.message.content + '\n**Denied verification**', components: [] });
                    }
                } as Index)[args[1]]();
            }
        } as Index)[args[0]]();
    } else if (interaction.isAutocomplete()) {
        const command = interaction.client.chatInputCommands.get(interaction.commandName);

        if (!command) {
            await interaction.respond([]);
            return log("Red", `Autocomplete - missing cached command: ${interaction.commandName}`);
        }

        if (!command.autocomplete) {
            await interaction.respond([]);
            return log("Red", `Autocomplete - missing autocomplete function: ${interaction.commandName}`);
        }

        await command.autocomplete(interaction);
    }
}
