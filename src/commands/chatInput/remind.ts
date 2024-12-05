import {
    type ChatInputCommandInteraction,
    type StringSelectMenuInteraction,
    ActionRowBuilder,
    ApplicationCommandOptionType,
    codeBlock,
    ComponentType,
    EmbedBuilder,
    StringSelectMenuBuilder,
} from "discord.js";
import ms from "ms";
import { Command } from "#structures";
import { collectAck } from "#util";

function formatTime(time: number) {
    return `<t:${Math.round(time / 1000)}> (<t:${Math.round(time / 1000)}:R>)`;
}

function rplText(content: string) {
    return { content, embeds: [], components: [] };
}

export default new Command<"chatInput">({
    async run(interaction) {
        async function promptDeletion(
            reminder: typeof interaction.client.reminders.doc,
            ackInt: StringSelectMenuInteraction<"cached"> | ChatInputCommandInteraction<"cached">
        ) {
            await collectAck({
                interaction: ackInt,
                time: 60_000,
                payload: {
                    embeds: [new EmbedBuilder()
                        .setColor(interaction.client.config.EMBED_COLOR)
                        .setDescription(`Are you sure you want to delete the reminder \`${reminder.content}\`?`)
                        .setFooter({ text: "60s to respond" })
                    ],
                    ephemeral: true
                },
                async confirm(int) {
                    await interaction.client.reminders.data.findByIdAndDelete(reminder);

                    await int.update(rplText(`Successfully deleted reminder \`${reminder.content}\``));
                },
                async cancel(int) {
                    await int.update(rplText("Command manually canceled"));
                },
                async rejection() {
                    await interaction.editReply(rplText("No response given, command canceled"));
                },
            });
        }

        switch (interaction.options.getSubcommand()) {
            case "create": {
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

                if (currentReminders.length > 25) return await interaction.reply({
                    content: "You can only have up to 25 reminders at a time",
                    ephemeral: true
                });

                await collectAck({
                    interaction,
                    payload: {
                        embeds: [new EmbedBuilder()
                            .setColor(interaction.client.config.EMBED_COLOR)
                            .setDescription([
                                "Are you sure you want to create a new reminder?",
                                `> Content: \`${reminderText}\``,
                                `> Time to remind: ${formatTime(timeToRemind)}`
                            ].join("\n"))
                            .setFooter({ text: "60s to respond" })
                        ],
                        ephemeral: true
                    },
                    async confirm(int) {
                        const reminder = await interaction.client.reminders.data.create({
                            userid: interaction.user.id,
                            content: reminderText,
                            time: timeToRemind,
                            ch: interaction.channelId
                        });

                        interaction.client.reminders.setExec(reminder._id, timeToRemind - Date.now());

                        await int.update({
                            components: [],
                            embeds: [new EmbedBuilder()
                                .setTitle("Reminder set")
                                .setDescription(codeBlock(reminderText) + "\n" + formatTime(timeToRemind))
                                .setColor(interaction.client.config.EMBED_COLOR)
                            ]
                        });
                    },
                    async cancel(int) {
                        await int.update(rplText("Command manually canceled"));
                    },
                    async rejection() {
                        await interaction.editReply(rplText("No response given, command canceled"));
                    },
                });

                break;
            };
            case "delete": {
                const userReminders = await interaction.client.reminders.data.find({ userid: interaction.user.id });

                if (userReminders.length === 0) return await interaction.reply({ content: "You have no active current reminders", ephemeral: true });

                if (userReminders.length === 1) return await promptDeletion(userReminders[0], interaction);

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId("reminders")
                    .setPlaceholder("Choose a reminder to delete");

                const embed = new EmbedBuilder()
                    .setColor(interaction.client.config.EMBED_COLOR)
                    .setTitle(`You have ${userReminders.length} active reminder(s)`)
                    .setFooter({ text: "Select a reminder to delete, 60s to respond" });

                for (const [i, x] of userReminders.entries()) {
                    const index = (i + 1).toString();

                    selectMenu.addOptions({ label: `#${index}`, value: index });

                    embed.addFields({
                        name: `#${index}`,
                        value: [
                            `> Content: \`${x.content}\``,
                            `> Time to remind: ${formatTime(x.time)}`
                        ].join("\n")
                    });
                }

                const msg = await interaction.reply({
                    embeds: [embed],
                    ephemeral: true,
                    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)],
                    fetchReply: true
                });

                msg.createMessageComponentCollector({
                    filter: x => x.user.id === interaction.user.id,
                    max: 1,
                    time: 60_000,
                    componentType: ComponentType.StringSelect
                })
                    .on("collect", int => promptDeletion(userReminders[parseInt(int.values[0]) - 1], int))
                    .on("end", async ints => {
                        if (!ints.size) await interaction.editReply(rplText("No response given, command canceled"));
                    });

                break;
            };
        }
    },
    data: {
        name: "remind",
        description: "Manage reminders",
        options: [
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "create",
                description: "Create a reminder",
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "what",
                        description: "The content of the reminder",
                        required: true
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "when",
                        description: "The time to remind from now (e.g. 5m, 3h, 1d)",
                        required: true
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "delete",
                description: "Delete an active reminder"
            }
        ]
    }
});
