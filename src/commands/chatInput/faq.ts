import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { Command } from "#structures";
import { fsServers } from "#util";

export default new Command<"chatInput">({
    async run(interaction) {
        const isFromTicket = interaction.channel!.parentId === interaction.client.config.mainServer.categories.activeTickets;
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
                await interaction.reply({ content, embeds: [new EmbedBuilder()
                    .setTitle("Reporting trolls")
                    .setColor(interaction.client.config.EMBED_COLOR)
                    .setImage(interaction.client.config.resources.faqTrollEmbedImage)
                    .setDescription([
                        `If a player is causing problems on a server, ${isFromTicket ? "let us know" : `don"t hesitate to send a report to ${fsServers.getPublicAll().map(([_, x]) => `<#${x.channelId}>`).join(" or ")}`} with:`,
                        "",
                        [
                            "- The name of the player",
                            "- What they are doing",
                            "- A picture or video as proof if possible",
                            isFromTicket ? "" : `- The <@&${interaction.client.config.mainServer.roles.mpStaff}> tag to notify staff`
                        ].join("\n"),
                        "",
                        `Please do not ping or DM individual staff members${isFromTicket ? "" : `, use the <@&${interaction.client.config.mainServer.roles.mpStaff}> tag as mentioned above`}.`,
                        `Check <#${interaction.client.config.mainServer.channels.mpRulesAndInfo}> to see what a good reason could be for a player report.`
                    ].join("\n"))
                ] });

                break;
            };
            case "appeal": {
                await interaction.reply([
                    `${content} `,
                    "\n",
                    "If you would like to appeal your ban on our MP servers, ",
                    `head to <#${interaction.client.config.mainServer.channels.support}> and open an [MP Support](${interaction.client.config.resources.faqAppealSupportMsg}) ticket to privately discuss it with MP Staff.`
                ].join(""));

                break;
            };
            case "todo": {
                await interaction.reply({ content, embeds: [new EmbedBuilder()
                    .setTitle("To-do")
                    .setColor(interaction.client.config.EMBED_COLOR)
                    .setFooter({
                        text: "Note that not every task listed might be available to do at the time, so do your due dilligence to see what needs doing in the moment."
                    })
                    .setFields(...fsServers.getPublicAll().map(([_, x]) => ({ name: x.fullName, value: "- " + x.todo.join("\n- ") })))
                ] });

                break;
            };
            case "filters": {
                await interaction.reply({ content, embeds: [new EmbedBuilder()
                    .setColor(interaction.client.config.EMBED_COLOR)
                    .setTitle("Please note that servers may \"ghost\" and not show up until you've refreshed your MP menu several times.")
                    .setImage(interaction.client.config.resources.faqFiltersEmbedImage)
                ] });

                break;
            };
            case "equipment": {
                await interaction.reply([
                    content, 
                    "Purchasing new equipment can cause large impacts, including:",
                    "- Increased slot amounts",
                    "- Increased file sizes, causing larger amounts of lag",
                    "Therefore, we try to refrain from purchasing any new equipment."
                ].join("\n"));

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
