import Discord, { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import YClient from '../client.js';
import ms from 'ms';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        ({
            create: async () => {
                const reminderText = interaction.options.getString("what", true);
                const reminderTime = ms(interaction.options.getString("when", true)) as number | undefined;
                
                if (reminderTime) {
                    const msg = await interaction.reply({
                        embeds: [new client.embed()
                            .setColor(client.config.embedColor)
                            .setDescription([
                                'Are you sure you want to create a new reminder?',
                                `> Content: \`${reminderText}\``,
                                `> Time to remind: <t:${Math.round((Date.now() + reminderTime) / 1000)}:R>`
                            ].join('\n'))
                            .setFooter({ text: '60s to respond' })
                        ],
                        fetchReply: true,
                        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder().setCustomId('yes').setStyle(ButtonStyle.Success).setLabel("Confirm"),
                            new ButtonBuilder().setCustomId('no').setStyle(ButtonStyle.Danger).setLabel("Cancel")
                        )]
                    });
                    
                    msg.createMessageComponentCollector({
                        filter: x => ["yes", "no"].includes(x.customId) && x.user.id === interaction.user.id,
                        max: 1,
                        time: 60_000
                    }).on('collect', async int => {
                        if (int.customId === 'yes') {
                            const [reminder] = await Promise.all([
                                client.reminders._content.create({ userid: interaction.user.id, content: reminderText, time: Date.now() + reminderTime, ch: msg.channelId, msg: msg.id }),
                                int.update({
                                    embeds: [new client.embed()
                                        .setTitle('Reminder set')
                                        .setDescription(`\n\`\`\`${reminderText}\`\`\`\n<t:${Math.round((Date.now() + reminderTime) / 1000)}:R>`)
                                        .setColor(client.config.embedColor)
                                    ],
                                    components: []
                                })
                            ]);

                            client.log('\x1b[33m', 'REMINDER CREATE', reminder);
                        } else int.update({ content: 'Command manually canceled', embeds: [], components: [] });
                    }).on('end', ints => {
                        if (ints.size === 0) interaction.editReply({ content: 'No response given, command canceled', embeds: [], components: [] });
                    });
                } else interaction.reply({
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
                    ],
                    ephemeral: true
                });
            },
            delete: async () => {
                const userReminders = await client.reminders._content.find({ userid: interaction.user.id });

                if (userReminders.length === 0) return interaction.reply('You have no active current reminders');

                const embed = new client.embed()
                    .setColor(client.config.embedColor)
                    .setTitle(`You have ${userReminders.length} active reminder(s)`)
                    .setFooter({ text: 'Select a reminder to delete by sending a message with the number associated with the reminder, 60s to respond' });

                for (const [i, x] of userReminders.entries()) embed.addFields({
                    name: `#${i + 1}`,
                    value: [
                        `> Content: \`${x.content}\``,
                        `> Time to remind: <t:${Math.round(x.time / 1000)}:R>`
                    ].join('\n')
                });

                await interaction.reply({ embeds: [embed] });
                (interaction.channel as Discord.TextChannel).awaitMessages({
                    filter: x => x.content.length < 5 && x.author.id === interaction.user.id,
                    max: 1,
                    time: 60_000,
                    errors: ['time']
                }).then(async msgs => {
                    let msg = msgs.first() as Discord.Message<true>;
                    msg.content = msg.content.replace('#', '');
                    const chosenReminder = userReminders[Number(msg.content) - 1] as typeof userReminders[0] | undefined;

                    if (chosenReminder) {
                        (await interaction.editReply({
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
                            filter: x => ["yes", "no"].includes(x.customId) && x.user.id === interaction.user.id,
                            max: 1,
                            time: 60_000
                        }).on('collect', async int => {
                            if (int.customId === 'yes') {
                                await Promise.all([
                                    client.reminders._content.findByIdAndDelete(chosenReminder._id),
                                    int.update({ content: `Successfully deleted reminder \`${chosenReminder.content}\``, embeds: [], components: [] })
                                ])
                                client.log('\x1b[33m', 'REMINDER DELETE', chosenReminder);
                            } else int.update({ content: 'Command manually canceled', embeds: [], components: [] });
                        }).on('end', ints => {
                            if (ints.size === 0) interaction.editReply({ content: 'No response given, command canceled', embeds: [], components: [] });
                        });
                    } else interaction.editReply({ content: 'No reminder found with the given index number, command canceled', embeds: [] });
                }).catch(() => {
                    interaction.editReply({ content: 'No response given, command canceled', embeds: [] });
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