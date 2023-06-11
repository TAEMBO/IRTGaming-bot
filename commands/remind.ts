import Discord, { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import YClient from '../client.js';
import ms from 'ms';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        function formatTime(time: number) {
            return `<t:${Math.round((time) / 1000)}> (<t:${Math.round((time) / 1000)}:R>)`;
        };
        function rplText(content: string) {
            return { content, embeds: [], components: [] };
        };

        ({
            create: async () => {
                const reminderText = interaction.options.getString("what", true);
                const reminderTime = ms(interaction.options.getString("when", true)) as number | undefined;
                
                if (reminderTime) {
                    const timeToRemind = Date.now() + reminderTime;
                    const currentReminders = await client.reminders._content.find({ userid: interaction.user.id });

                    if (currentReminders.length > 25) return interaction.reply({ content: 'You can only have up to 25 reminders at a time', ephemeral: true });

                    const msg = await interaction.reply({
                        embeds: [new client.embed()
                            .setColor(client.config.embedColor)
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
                    });
                    
                    msg.createMessageComponentCollector({
                        filter: x => x.user.id === interaction.user.id,
                        max: 1,
                        time: 60_000
                    }).on('collect', async int => {
                        ({
                            yes: () => Promise.all([
                                client.reminders._content.create({ userid: interaction.user.id, content: reminderText, time: timeToRemind, ch: interaction.channelId }),
                                int.update({
                                    components: [],
                                    embeds: [new client.embed()
                                        .setTitle('Reminder set')
                                        .setDescription(`\n\`\`\`${reminderText}\`\`\`\n${formatTime(timeToRemind)}`)
                                        .setColor(client.config.embedColor)
                                    ]
                                })
                            ]),
                            no: () => int.update(rplText('Command manually canceled'))
                        } as any)[int.customId]();
                    }).on('end', ints => {
                        if (ints.size < 1) interaction.editReply(rplText('No response given, command canceled'));
                    });
                } else interaction.reply({
                    ephemeral: true,
                    embeds: [new client.embed()
                        .setTitle('Incorrect timestamp')
                        .setColor(client.config.embedColorRed)
                        .setFields({
                            name: 'Proper formatting',
                            value: [
                                '```Seconds: 10s, 1sec, 10secs, 1second, 10seconds',
                                'Minutes: 10m, 1min, 10mins, 1minute, 10minutes',
                                'Hours: 10h, 1hour, 10hours',
                                'Days: 10d, 1day, 10days```'
                            ].join('\n')
                        })
                    ]
                });
            },
            delete: async () => {
                const userReminders = await client.reminders._content.find({ userid: interaction.user.id });

                if (userReminders.length < 1) return interaction.reply({ content: 'You have no active current reminders', ephemeral: true }).then(m => m.createMessageComponentCollector);

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('reminders')
                    .setPlaceholder('Choose a reminder to delete');

                const embed = new client.embed()
                    .setColor(client.config.embedColor)
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
                    time: 60_000
                }).on('collect', async (int: Discord.StringSelectMenuInteraction<"cached">) => {
                    const chosenReminder = userReminders[parseInt(int.values[0]) - 1];

                    (await int.update({
                        embeds: [new client.embed()
                            .setColor(client.config.embedColor)
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
                                client.reminders._content.findByIdAndDelete(chosenReminder._id),
                                int.update(rplText(`Successfully deleted reminder \`${chosenReminder.content}\``))
                            ]),
                            no: () => int.update(rplText('Command manually canceled'))
                        } as any)[int.customId]();
                    }).on('end', ints => {
                        if (ints.size < 1) interaction.editReply(rplText('No response given, command canceled'));
                    });
                }).on('end', ints => {
                    if (ints.size < 1) interaction.editReply(rplText('No response given, command canceled'));
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
                .setDescription('When to remind, do "help" to see format')
                .setRequired(true)))
        .addSubcommand(x=>x
            .setName('delete')
            .setDescription('Delete an active reminder'))
};