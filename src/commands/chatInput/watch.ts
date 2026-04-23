import { ApplicationCommandOptionType } from "discord.js";
import { eq } from "drizzle-orm";
import { db, watchListPingsTable, watchListTable } from "#db";
import { Command } from "#structures";
import { collectAck, isMPStaff, youNeedRole } from "#util";

const regExp = new RegExp(/https?:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/channels\/(\d{17,19})?\/(\d{17,20})\/(\d{17,20})/);

export default new Command<"chatInput">({
    async run(interaction) {
        if (!isMPStaff(interaction.member)) return await youNeedRole(interaction, "mpStaff");

        switch (interaction.options.getSubcommand()) {
            case "add": {
                const reason = interaction.options.getString("reason", true);
                const name = interaction.options.getString("username", true);
                const severity = interaction.options.getString("severity", true) as "ban" | "watch";
                const reference = interaction.options.getString("reference", false);
                const watchListData = (await db.select().from(watchListTable).where(eq(watchListTable.name, name))).at(0);

                if (watchListData) return interaction.reply(`\`${name}\` already exists for reason \`${watchListData.reason}\``);

                if (reference && !regExp.test(reference)) return interaction.reply("Invalid reference, must be a message link!");

                await db.insert(watchListTable).values({
                    name,
                    reason,
                    isSevere: severity === "ban",
                    reference
                });

                let resultText = `Successfully added \`${name}\``;

                resultText += `\nReason: ${reason}`;
                resultText += `\nSeverity: **${severity === "ban" ? "Needs banning" : "Needs watching over"}**`;

                if (reference) resultText += `\nReference: ${reference}`;

                await interaction.reply(resultText);

                break;
            };
            case "update": {
                const name = interaction.options.getString("username", true);
                const reason = interaction.options.getString("reason", false);
                const severity = interaction.options.getString("severity", false) as "ban" | "watch" | null;
                const reference = interaction.options.getString("reference", false);
                const watchListData = (await db.select().from(watchListTable).where(eq(watchListTable.name, name))).at(0);

                if (!watchListData) return interaction.reply(`\`${name}\` doesn't exist on watch list`);

                if (reference && !regExp.test(reference)) return interaction.reply("Invalid reference, must be a message link!");

                await db
                    .update(watchListTable)
                    .set({
                        reason: reason ?? undefined,
                        isSevere: severity ? severity === "ban" : undefined,
                        reference: reference ?? undefined
                    })
                    .where(eq(watchListTable.name, name));

                let resultContent = `Successfully updated watch list details for \`${name}\``;

                if (reason) resultContent += `\nReason: \`${reason}\``;

                if (severity) resultContent += `\nSeverity: **${severity === "ban" ? "Needs banning" : "Needs watching over"}**`;

                if (reference) resultContent += `\nReference: \`${reference}\``;

                await interaction.reply(resultContent);

                break;
            }
            case "remove": {
                const name = interaction.options.getString("username", true);
                const watchListData = (await db.select().from(watchListTable).where(eq(watchListTable.name, name))).at(0);

                if (!watchListData) return interaction.reply(`\`${name}\` doesn't exist on watch list`);

                await db.delete(watchListTable).where(eq(watchListTable.name, name));

                await interaction.reply(`Successfully removed \`${name}\` from watch list`);

                break;
            };
            case "view": {
                const username = interaction.options.getString("username", false);
                const watchListData = await db.select().from(watchListTable);

                if (username) {
                    const playerData = watchListData.find(x => x.name === username);

                    if (playerData) {
                        await interaction.reply(
                            `Player name: \`${playerData.name}\`` +
                            `\nReason: ${playerData.reason}` +
                            `\nSeverity: **${(playerData.isSevere ? "Needs banning" : "Needs watching over")}**` +
                            (playerData.reference ? `\nReference: ${playerData.reference}` : "")
                        );
                    } else {
                        await interaction.reply(`\`${username}\` doesn't exist on watch list`);
                    }
                } else {
                    await interaction.reply({ files: [{
                        attachment: Buffer.from(JSON.stringify(watchListData, null, 2)),
                        name: "watch_list.json"
                    }] });
                }

                break;
            };
            case "notifications": {
                const watchListPingsData = await db.select().from(watchListPingsTable);

                if (!watchListPingsData.some(x => x.userId === interaction.user.id)) {
                    await db.insert(watchListPingsTable).values({ userId: interaction.user.id });

                    return interaction.reply(
                        "Successfully subscribed to watch list notifications for players needing banning" +
                        "\n-# Run this command again to unsubscribe"
                    );
                }

                await collectAck({
                    interaction,
                    payload: {
                        content: "You are already subscribed to watch list notifications. Do you want to unsubscribe?"
                    },
                    async confirm(int) {
                        await db.delete(watchListPingsTable).where(eq(watchListPingsTable.userId, interaction.user.id));

                        await int.update({ content: "Successfully unsubscribed from watch list notifications", components: [] });
                    },
                    async cancel(int) {
                        await int.update({ content: "Command canceled", components: [] });
                    },
                });

                break;
            };
        };
    },
    data: {
        name: "watch",
        description: "Manage watch list",
        options: [
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "add",
                description: "Add a player to watch list",
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "username",
                        description: "The player name to add",
                        required: true
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "reason",
                        description: "The reason for adding the player",
                        required: true
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "severity",
                        description: "Whether this player needs to be banned or watched over",
                        choices: [
                            { name: "Needs to be banned", value: "ban" },
                            { name: "Needs watching over", value: "watch" }
                        ],
                        required: true
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "reference",
                        description: "An optional reference (message link) to attach",
                        required: false
                    },
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "update",
                description: "Update the details of a watch list entry",
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "username",
                        description: "The player name to update the details for",
                        required: true
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "reason",
                        description: "The updated reason for adding the player",
                        required: false
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "severity",
                        description: "Update whether this player needs to be banned or watched over",
                        choices: [
                            { name: "Needs to be banned", value: "ban" },
                            { name: "Needs watching over", value: "watch" }
                        ],
                        required: false
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "reference",
                        description: "An optional updated reference (message link) to attach",
                        required: false
                    },
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "remove",
                description: "Remove a player from watch list",
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "username",
                        description: "The player name to remove",
                        required: true
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "view",
                description: "View watch list details",
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "username",
                        description: "The player name to view details of",
                        required: false
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "notifications",
                description: "Manage your subscription to watch list notifications"
            }
        ]
    }
});
