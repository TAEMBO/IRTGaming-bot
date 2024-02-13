import {
    ActionRowBuilder,
    type ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    type StringSelectMenuInteraction,
    StringSelectMenuOptionBuilder
} from "discord.js";
import ms from "ms";
import type { RemindersDocument } from "../../typings.js";
import { Command, ackButtons, lookup } from "../../utils.js";

export default new Command<"chatInput">({
    async run(interaction) {
        function formatTime(time: number) {
            return `<t:${Math.round(time / 1000)}> (<t:${Math.round(time / 1000)}:R>)`;
        }

        function rplText(content: string) {
            return { content, embeds: [], components: [] };
        }

        async function promptDeletion(
            reminder: RemindersDocument,
            int: StringSelectMenuInteraction<"cached"> | ChatInputCommandInteraction<"cached">
        ) {
            const intOptions = {
                embeds: [new EmbedBuilder()
                    .setColor(interaction.client.config.EMBED_COLOR)
                    .setDescription(`Are you sure you want to delete the reminder \`${reminder.content}\`?`)
                    .setFooter({ text: "60s to respond" })
                ],
                ephemeral: true,
                components: ackButtons()
            };

            (await (int.isChatInputCommand()
                ? int.reply(intOptions)
                : int.update(intOptions)
            )).createMessageComponentCollector({
                filter: x => x.user.id === interaction.user.id,
                max: 1,
                time: 60_000,
                componentType: ComponentType.Button
            }).on("collect", int => void lookup({
                confirm: () => Promise.all([
                    interaction.client.reminders.data.findByIdAndDelete(reminder),
                    int.update(rplText(`Successfully deleted reminder \`${reminder.content}\``))
                ]),
                cancel: () => int.update(rplText("Command manually canceled"))
            }, int.customId)).on("end", ints => {
                if (!ints.size) interaction.editReply(rplText("No response given, command canceled"));
            });
        }

        await lookup({
            async create() {
                const reminderText = interaction.options.getString("what", true);
                const reminderTime = ms(interaction.options.getString("when", true)) as number | undefined;
                
                if (!reminderTime) return await interaction.reply({
                    ephemeral: true,
                    embeds: [new EmbedBuilder()
                        .setTitle("Incorrect timestamp")
                        .setColor(interaction.client.config.EMBED_COLOR)
                        .setDescription([
                            "**Format:** `[amount][quantity]`",
                            "**Quantities:**",
                            [
                                "- Seconds: `s`, `sec`, `secs`, `second`, `seconds`",
                                "- Minutes: `m`, `min`, `mins`, `minute`, `minutes`",
                                "- Hours: `h`, `hour`, `hours`",
                                "- Days: `d`, `day`, `days`"
                            ].join("\n"),
                            "**Examples:** `60s`, `1min`, `45minutes`, `3hours`, `7days`"
                        ].join("\n"))
                        .setFooter({ text: "Note that times should be relative from now, i.e. 45 minutes from now" })
                    ]
                });

                if (reminderTime < 10_000) return await interaction.reply({
                    ephemeral: true,
                    content: "You cannot set a reminder to expire in less than 10 seconds."
                });

                const timeToRemind = Date.now() + reminderTime;
                const currentReminders = await interaction.client.reminders.data.find({ userid: interaction.user.id });

                if (currentReminders.length > 25) return await interaction.reply({ content: "You can only have up to 25 reminders at a time", ephemeral: true });

                (await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(interaction.client.config.EMBED_COLOR)
                        .setDescription([
                            "Are you sure you want to create a new reminder?",
                            `> Content: \`${reminderText}\``,
                            `> Time to remind: ${formatTime(timeToRemind)}`
                        ].join("\n"))
                        .setFooter({ text: "60s to respond" })
                    ],
                    ephemeral: true,
                    components: ackButtons()
                })).createMessageComponentCollector({
                    filter: x => x.user.id === interaction.user.id,
                    max: 1,
                    time: 60_000,
                    componentType: ComponentType.Button
                }).on("collect", int => void lookup({
                    async confirm() {
                        const reminder = await interaction.client.reminders.data.create({ userid: interaction.user.id, content: reminderText, time: timeToRemind, ch: interaction.channelId });

                        interaction.client.reminders.setExec(reminder._id, timeToRemind - Date.now());
                        await int.update({
                            components: [],
                            embeds: [new EmbedBuilder()
                                .setTitle("Reminder set")
                                .setDescription(`\n\`\`\`${reminderText}\`\`\`\n${formatTime(timeToRemind)}`)
                                .setColor(interaction.client.config.EMBED_COLOR)
                            ]
                        });
                    },
                    cancel() {
                        return int.update(rplText("Command manually canceled"));
                    }
                }, int.customId)).on("end", ints => {
                    if (!ints.size) interaction.editReply(rplText("No response given, command canceled"));
                });
            },
            async delete() {
                const userReminders = await interaction.client.reminders.data.find({ userid: interaction.user.id });

                if (userReminders.length === 0)  {
                    await interaction.reply({ content: "You have no active current reminders", ephemeral: true });
                } else if (userReminders.length === 1) {
                    await promptDeletion(userReminders[0], interaction);
                } else {
                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId("reminders")
                        .setPlaceholder("Choose a reminder to delete");

                    const embed = new EmbedBuilder()
                        .setColor(interaction.client.config.EMBED_COLOR)
                        .setTitle(`You have ${userReminders.length} active reminder(s)`)
                        .setFooter({ text: "Select a reminder to delete, 60s to respond" });

                    for (const [i, x] of userReminders.entries()) {
                        const index = (i + 1).toString();

                        selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel(`#${index}`).setValue(index));
                    
                        embed.addFields({
                            name: `#${index}`,
                            value: [
                                `> Content: \`${x.content}\``,
                                `> Time to remind: ${formatTime(x.time)}`
                            ].join("\n")
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
                    })
                        .on("collect", int => promptDeletion(userReminders[parseInt(int.values[0]) - 1], int))
                        .on("end", ints => {
                            if (!ints.size) interaction.editReply(rplText("No response given, command canceled"));
                        });
                }
            }
        }, interaction.options.getSubcommand());
    },
    data: new SlashCommandBuilder()
        .setName("remind")
        .setDescription("Manage reminders")
        .addSubcommand(x => x
            .setName("create")
            .setDescription("Create a reminder")
            .addStringOption(x => x
                .setName("what")
                .setDescription("The reminder itself")
                .setRequired(true))
            .addStringOption(x => x
                .setName("when")
                .setDescription("The time to remind from now. Do \"help\" to see format")
                .setRequired(true)))
        .addSubcommand(x => x
            .setName("delete")
            .setDescription("Delete an active reminder"))
});