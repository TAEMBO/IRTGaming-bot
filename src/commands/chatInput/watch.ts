import { ApplicationCommandOptionType, AttachmentBuilder, ComponentType, EmbedBuilder } from "discord.js";
import { Command } from "#structures";
import { ACK_BUTTONS, isMPStaff, youNeedRole } from "#util";

export default new Command<"chatInput">({
    async run(interaction) {
        if (!isMPStaff(interaction.member)) return await youNeedRole(interaction, "mpStaff");

        switch (interaction.options.getSubcommand()) {
            case "add": {
                const reason = interaction.options.getString("reason", true);
                const name = interaction.options.getString("username", true);
                const severity = interaction.options.getString("severity", true) as "ban" | "watch";
                const wlData = await interaction.client.watchList.data.findById(name);

                if (wlData) return await interaction.reply(`\`${name}\` already exists for reason \`${wlData.reason}\``);

                await interaction.client.watchList.data.create({ _id: name, reason, isSevere: severity === "ban" });
                await interaction.reply(`Successfully added \`${name}\` who needs to be **${severity === "ban" ? "banned" : "watched over"}** with reason \`${reason}\``);

                break;
            };
            case "remove": {
                const name = interaction.options.getString("username", true);
                const wlData = await interaction.client.watchList.data.findById(name);

                if (!wlData) return await interaction.reply(`\`${name}\` doesn"t exist on watchList`);

                await interaction.client.watchList.data.findByIdAndDelete(name);
                await interaction.reply(`Successfully removed \`${name}\` from watchList`);

                break;
            };
            case "view": {
                await interaction.reply({ files: [
                    new AttachmentBuilder(Buffer.from(JSON.stringify(await interaction.client.watchList.data.find(), null, 2)), { name: "watchListCache.json" })
                ] });

                break;
            };
            case "subscription": {
                if (!interaction.client.watchListPings.cache.includes(interaction.user.id)) {
                    await interaction.client.watchListPings.add(interaction.user.id);

                    return await interaction.reply({ embeds: [new EmbedBuilder()
                        .setDescription("You have successfully subscribed to watchList notifications")
                        .setFooter({ text: "Run this command again if this was a mistake" })
                        .setColor(interaction.client.config.EMBED_COLOR)
                    ] });
                }

                (await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setDescription("You are already subscribed to watchList notifications, do you want to unsubscribe?")
                        .setColor(interaction.client.config.EMBED_COLOR)
                    ],
                    fetchReply: true,
                    components: ACK_BUTTONS
                })).createMessageComponentCollector({
                    filter: x => x.user.id === interaction.user.id,
                    max: 1,
                    time: 30_000,
                    componentType: ComponentType.Button
                }).on("collect", async int => {
                    if (int.customId === "cancel") {
                        return await int.update({
                            embeds: [new EmbedBuilder().setDescription("Command canceled").setColor(interaction.client.config.EMBED_COLOR)],
                            components: []
                        });
                    }

                    await interaction.client.watchListPings.remove(interaction.user.id);

                    await int.update({
                        embeds: [new EmbedBuilder()
                            .setDescription("You have successfully unsubscribed from watchList notifications")
                            .setColor(interaction.client.config.EMBED_COLOR)
                        ],
                        components: []
                    });
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
                description: "Add a player to watchList",
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
                            { name: "Needs to be watched over", value: "watch" }
                        ],
                        required: true
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "remove",
                description: "Remove a player from watchList",
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
                description: "View the entire watch list"
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "subscription",
                description: "Manage your subscription to watchList notifications"
            }
        ]
    }
});
