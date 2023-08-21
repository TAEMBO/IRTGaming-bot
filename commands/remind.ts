import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType } from 'discord.js';
import ms from 'ms';
import { TInteraction } from '../typings.js';

export default {
	async run(interaction: TInteraction) {
        function formatTime(time: number) {
            return `<t:${Math.round(time / 1000)}> (<t:${Math.round(time / 1000)}:R>)`;
        };
        function rplText(content: string) {
            return { content, embeds: [], components: [] };
        };

        ({
            create: async () => {
                const reminderText = interaction.options.getString("what", true);
                const reminderTime = ms(interaction.options.getString("when", true)) as number | undefined;
                
                if (!reminderTime) return interaction.reply({
                    ephemeral: true,
                    embeds: [new EmbedBuilder()
                        .setTitle('Incorrect timestamp')
                        .setColor(interaction.client.config.embedColorRed)
                        .setDescription([
                            '**Format:** `[amount][quantity]`',
                            '**Quantities:**',
                            [
                                '- Seconds: `s`, `sec`, `secs`, `second`, `seconds`',
                                '- Minutes: `m`, `min`, `mins`, `minute`, `minutes`',
                                '- Hours: `h`, `hour`, `hours`',
                                '- Days: `d`, `day`, `days`'
                            ].join('\n'),
                            '**Examples:** `60s`, `1min`, `45minutes`, `3hours`, `7days`'
                        ].join('\n'))
                        .setFooter({ text: 'Note that times should be relative from now, i.e. 45 minutes from now' })
                    ]
                });

                if (reminderTime < 10_000) return interaction.reply({
                    ephemeral: true,
                    content: 'You cannot set a reminder to expire in less than 10 seconds.'
                });

                const timeToRemind = Date.now() + reminderTime;
                const currentReminders = await interaction.client.reminders.data.find({ userid: interaction.user.id });

                if (currentReminders.length > 25) return interaction.reply({ content: 'You can only have up to 25 reminders at a time', ephemeral: true });

                (await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(interaction.client.config.embedColor)
                        .setDescription([
                            'Are you sure you want to create a new reminder?',
                            `> Content: \`${reminderText}\``,
                            `> Time to remind: ${formatTime(timeToRemind)}`
                        ].join('\n'))
                        .setFooter({ text: '60s to respond' })
                    ],
                    ephemeral: true,
                    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder().setCustomId('yes').setStyle(ButtonStyle.Success).setLabel("Confirm"),
                        new ButtonBuilder().setCustomId('no').setStyle(ButtonStyle.Danger).setLabel("Cancel")
                    )]
                })).createMessageComponentCollector({
                    filter: x => x.user.id === interaction.user.id,
                    max: 1,
                    time: 60_000
                }).on('collect', async int => {
                    ({
                        yes: async () => {
                            const reminder = await interaction.client.reminders.data.create({ userid: interaction.user.id, content: reminderText, time: timeToRemind, ch: interaction.channelId });

                            interaction.client.reminders.setExec(reminder._id, timeToRemind - Date.now());
                            int.update({
                                components: [],
                                embeds: [new EmbedBuilder()
                                    .setTitle('Reminder set')
                                    .setDescription(`\n\`\`\`${reminderText}\`\`\`\n${formatTime(timeToRemind)}`)
                                    .setColor(interaction.client.config.embedColor)
                                ]
                            });
                        },
                        no: () => int.update(rplText('Command manually canceled'))
                    } as any)[int.customId]();
                }).on('end', ints => {
                    if (!ints.size) interaction.editReply(rplText('No response given, command canceled'));
                });
            },
            delete: async () => {
                const userReminders = await interaction.client.reminders.data.find({ userid: interaction.user.id });

                if (!userReminders.length) return interaction.reply({ content: 'You have no active current reminders', ephemeral: true });

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('reminders')
                    .setPlaceholder('Choose a reminder to delete');

                const embed = new EmbedBuilder()
                    .setColor(interaction.client.config.embedColor)
                    .setTitle(`You have ${userReminders.length} active reminder(s)`)
                    .setFooter({ text: 'Select a reminder to delete, 60s to respond' });

                for (const [i, x] of userReminders.entries()) {
                    const index = (i + 1).toString();

                    selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel(`#${index}`).setValue(index));
                    
                    embed.addFields({
                        name: `#${index}`,
                        value: [
                            `> Content: \`${x.content}\``,
                            `> Time to remind: ${formatTime(x.time)}`
                        ].join('\n')
                    });
                }

                (await interaction.reply({
                    embeds: [embed],
                    ephemeral: true,
                    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)]
                })).createMessageComponentCollector({
                    filter: x => x.user.id === interaction.user.id,
                    max: 1,
                    time: 60_000,
                    componentType: ComponentType.StringSelect
                }).on('collect', async int => {
                    const chosenReminder = userReminders[parseInt(int.values[0]) - 1];

                    (await int.update({
                        embeds: [new EmbedBuilder()
                            .setColor(interaction.client.config.embedColor)
                            .setDescription(`Are you sure you want to delete the reminder \`${chosenReminder.content}\`?`)
                            .setFooter({ text: '60s to respond' })
                        ],
                        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder().setCustomId('yes').setStyle(ButtonStyle.Success).setLabel("Confirm"),
                            new ButtonBuilder().setCustomId('no').setStyle(ButtonStyle.Danger).setLabel("Cancel")
                        )]
                    })).createMessageComponentCollector({
                        filter: x => x.user.id === interaction.user.id,
                        max: 1,
                        time: 60_000
                    }).on('collect', async int => {
                        ({
                            yes: () => Promise.all([
                                interaction.client.reminders.data.findByIdAndDelete(chosenReminder._id),
                                int.update(rplText(`Successfully deleted reminder \`${chosenReminder.content}\``))
                            ]),
                            no: () => int.update(rplText('Command manually canceled'))
                        } as any)[int.customId]();
                    }).on('end', ints => {
                        if (!ints.size) interaction.editReply(rplText('No response given, command canceled'));
                    });
                }).on('end', ints => {
                    if (!ints.size) interaction.editReply(rplText('No response given, command canceled'));
                });
            }
        } as any)[interaction.options.getSubcommand()]();
      },
      data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Manage reminders')
        .addSubcommand(x=>x
            .setName('create')
            .setDescription('Create a reminder')
            .addStringOption(x=>x
                .setName('what')
                .setDescription('The reminder itself')
                .setRequired(true))
            .addStringOption(x=>x
                .setName('when')
                .setDescription('The time to remind from now. Do "help" to see format')
                .setRequired(true)))
        .addSubcommand(x=>x
            .setName('delete')
            .setDescription('Delete an active reminder'))
};