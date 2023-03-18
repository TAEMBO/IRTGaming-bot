import Discord, { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import YClient from '../client';

export default async (client: YClient, interaction: Discord.BaseInteraction) => {
    if (!interaction.inGuild() || !interaction.inCachedGuild() || !interaction.channel) return;

    if (interaction.isChatInputCommand()) {
        const subCmd = interaction.options.getSubcommand(false);
        const commandFile = client.commands.get(interaction.commandName);

        console.log(client.timeLog('\x1b[37m'), `\x1b[32m${interaction.user.tag}\x1b[37m used \x1b[32m/${interaction.commandName} ${subCmd ?? ''}\x1b[37m in \x1b[32m#${interaction.channel.name}`);
        if (!client.config.botSwitches.commands && !client.config.devWhitelist.includes(interaction.user.id)) return interaction.reply('Commands are currently disabled.');

        commandFile.default.run(client, interaction);
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
        } else if (interaction.customId === 'mpReport') {
            interaction.showModal(new ModalBuilder().setCustomId('mpReport').setTitle('MP Report').addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder().setCustomId('serverName').setLabel('Server name').setStyle(TextInputStyle.Short).setPlaceholder('Silage or Grain').setMaxLength(6)),
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder().setCustomId('playerNames').setLabel('Player names').setStyle(TextInputStyle.Short).setPlaceholder('Who\'s causing trouble? (skip if none)').setRequired(false)),
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder().setCustomId('reason').setLabel('Reason for report').setStyle(TextInputStyle.Paragraph))
            ));
        } else console.log(client.timeLog('\x1b[35m'), `Alternate button pressed at ${interaction.message.url}`);
    } else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'mpReport') {
            interaction.reply({
                ephemeral: true,
                embeds: [new client.embed()
                    .setColor(client.config.embedColor)
                    .setTitle('Your report has been sent!')
                    .setDescription('If you\'re reporting a player, please refrain from announcing in-game that a staff member may be coming, as it does not assist staff members.')]
            });

            const serverName = interaction.fields.fields.get('serverName')?.value as string;
            const playerNames = interaction.fields.fields.get('playerNames')?.value as string;
            const reason = interaction.fields.fields.get('reason')?.value as string;
            
            (client.channels.resolve('733828561215029268') as Discord.TextChannel).send({
                content: client.reportCooldown.isActive ? undefined : `No role ping for now`,
                embeds: [new client.embed()
                    .setTitle(`MP Report by ${interaction.user.tag}`)
                    .setColor(client.config.embedColor)
                    .setTimestamp()
                    .setDescription(`<@${interaction.user.id}>\n\`${interaction.user.id}\``)
                    .addFields(
                        { name: 'Server', value: serverName },
                        { name: 'Reported players', value: playerNames.length > 0 ? playerNames : '*No names provided*' },
                        { name: 'Reason', value: reason })
                ]
            });
            
            client.reportCooldown.isActive = true;
            clearInterval(client.reportCooldown.timeout as NodeJS.Timeout);
            client.reportCooldown.timeout = setTimeout(() => { client.reportCooldown.isActive = false; console.log('eee') }, 20000);
        }
    }
}
