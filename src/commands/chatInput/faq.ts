import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    channelMention,
    EmbedBuilder,
    hyperlink,
    roleMention
} from "discord.js";
import { Command } from "#structures";
import { fs22Servers, fs25Servers } from "#util";

export default new Command<"chatInput">({
    async run(interaction) {
        const content = interaction.options.getUser("user", false)?.toString() || "";

        switch (interaction.options.getString("question", true)) {
            case "staff": {
                await interaction.reply({ content, components: [
                    new ActionRowBuilder<ButtonBuilder>().setComponents(
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Link)
                            .setURL(interaction.client.config.resources.faqStaffButtonRedirect)
                            .setLabel("Apply for MP Staff")
                    )
                ] });

                break;
            };
            case "troll": {
                const channelMentions = [
                    ...fs22Servers.getPublicAll().map(x => channelMention(x[1].channelId)),
                    ...fs25Servers.getPublicAll().map(x => channelMention(x[1].channelId))
                ];
                const isFromTicket = interaction.channel!.parentId === interaction.client.config.mainServer.categories.activeTickets;
                const { mp22RulesAndInfo, mp25RulesAndInfo } = interaction.client.config.mainServer.channels;
                const infoChannels = [channelMention(mp22RulesAndInfo), channelMention(mp25RulesAndInfo)];
                const staffMention = roleMention(interaction.client.config.mainServer.roles.mpStaff);
                const ticketTextOpening = isFromTicket ? "let us know" : `don't hesitate to send a report to ${channelMentions.join(" or ")}`;
                const ticketTextClosing = isFromTicket ? "" : `, use the ${staffMention} tag as mentioned above`;

                await interaction.reply({ content, embeds: [new EmbedBuilder()
                    .setTitle("Reporting trolls")
                    .setColor(interaction.client.config.EMBED_COLOR)
                    .setImage(interaction.client.config.resources.faqTrollEmbedImage)
                    .setDescription(
                        `If a player is causing problems on a server, ${ticketTextOpening} with:\n\n` +
                        "- The name of the player\n" +
                        "- What they are doing\n" +
                        "- A picture or video as proof if possible\n" +
                        (isFromTicket ? "\n\n" : `- The ${staffMention} tag to notify staff\n\n`) +
                        `Please do not ping or DM individual staff members${ticketTextClosing}.\n` +
                        `Check ${infoChannels.join(" or ")} to see what a good reason could be for a player report.`
                    )
                ] });

                break;
            };
            case "appeal": {
                const channel = channelMention(interaction.client.config.mainServer.channels.support);
                const supportHyperlink = hyperlink("MP Support", interaction.client.config.resources.faqAppealSupportMsg);

                await interaction.reply(
                    `${content} \n` +
                    "If you would like to appeal your ban on our MP servers, " +
                    `head to ${channel} and open an ${supportHyperlink} ticket to privately discuss it with MP Staff.`
                );

                break;
            };
            case "todo": {
                await interaction.reply({ content, embeds: [new EmbedBuilder()
                    .setTitle("To-do")
                    .setColor(interaction.client.config.EMBED_COLOR)
                    .setFooter({ text:
                        "Note that not every task listed might be available to do at the time, " +
                        "so do your due dilligence to see what needs doing in the moment."
                    })
                    .setFields(
                        ...fs22Servers.getPublicAll().map(([_, x]) => ({ name: x.fullName, value: "- " + x.todo.join("\n- ") })),
                        ...fs25Servers.getPublicAll().map(([_, x]) => ({ name: x.fullName, value: "- " + x.todo.join("\n- ") }))
                    )
                ] });

                break;
            };
            case "filters": {
                await interaction.reply({ content, embeds: [new EmbedBuilder()
                    .setColor(interaction.client.config.EMBED_COLOR)
                    .setFooter({ text:
                        "Please note that servers may \"ghost\" and not show up" +
                        "until you've refreshed your MP menu several times."
                    })
                    .setImage(interaction.client.config.resources.faqFiltersEmbedImage)
                ] });

                break;
            };
            case "equipment": {
                await interaction.reply(
                    content +
                    "\nPurchasing new equipment can cause large impacts, including:" +
                    "\n- Increased slot amounts" +
                    "\n- Increased file sizes, causing larger amounts of lag" +
                    "\nTherefore, we try to refrain from purchasing any new equipment."
                );

                break;
            };
        }
    },
    data: {
        name: "faq",
        description: "Frequently asked questions",
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: "question",
                description: "A list of answers to frequently asked questions",
                choices: [
                    { name: "Applying for MP Staff", value: "staff" },
                    { name: "Reporting trolls", value: "troll" },
                    { name: "Appeal an MP ban", value: "appeal" },
                    { name: "What to do on MP servers", value: "todo" },
                    { name: "MP filters to join", value: "filters" },
                    { name: "Buying equipment", value: "equipment" }
                ],
                required: true
            },
            {
                type: ApplicationCommandOptionType.User,
                name: "user",
                description: "The optional user to notify of with this FAQ answer",
                required: false
            }
        ]
    }
});
