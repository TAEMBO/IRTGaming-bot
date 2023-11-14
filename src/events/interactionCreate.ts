import { Interaction } from 'discord.js';
import { hasRole, log, onMFFarms } from '../utilities.js';
import { Command, Index } from '../typings.js';

export default async (interaction: Interaction) => {
    if (!interaction.inGuild() || !interaction.inCachedGuild()) return;

    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'ping') {
            const msg = await interaction.reply({ content: 'Pinging...', fetchReply: true });

            return await msg.edit(`Websocket: \`${interaction.client.ws.ping}\`ms\nBot: \`${msg.createdTimestamp - interaction.createdTimestamp}\`ms`);
        }
        
        const subCmd = interaction.options.getSubcommand(false);
        const command = interaction.client.commands.get(interaction.commandName) as Command;

        log('White', `\x1b[32m${interaction.user.tag}\x1b[37m used \x1b[32m/${interaction.commandName} ${subCmd ?? ''}\x1b[37m in \x1b[32m#${interaction.channel?.name}`);

        if (!interaction.client.config.toggles.commands && !interaction.client.config.devWhitelist.includes(interaction.user.id)) return await interaction.reply('Commands are currently disabled.');

        try {
            await command.run(interaction);
            command.uses++;
        } catch (err) {
            const errMsg = ":warning: An error occurred while running this command, bot developer(s) notified of matter";

            interaction.client.emit('intErr', err);

            interaction.replied
                ? await interaction.followUp(errMsg) // Interaction replied to
                : interaction.deferred
                    ? await interaction.editReply(errMsg) // Interaction deferred
                    : await interaction.reply(errMsg); // Interaction not replied to or deferred
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
        await ({
            async mf() {
                const displayedRoles = (() => {
                    if (hasRole(interaction.member, 'mpmanager') || hasRole(interaction.member, 'mfmanager')) {
                        return interaction.client.config.mainServer.mfFarmRoles.map(x => interaction.client.getRole(x));
                    } else if (hasRole(interaction.member, 'mffarmowner')) {
                        return interaction.client.config.mainServer.mfFarmRoles.map(x => interaction.client.getRole(x)).filter(x => onMFFarms(interaction.member).some(y => x.id === y));
                    } else {
                        return [];
                    }
                })();

                await interaction.respond(displayedRoles.map(({ name, id }) => ({ name, value: id })));
            }
        } as Index)[interaction.commandName]();
    }
}
