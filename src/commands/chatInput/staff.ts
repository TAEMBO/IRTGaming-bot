import { ApplicationCommandOptionType, EmbedBuilder, inlineCode, type Role, type GuildMember } from "discord.js";
import { db, fmNamesTable, tfNamesTable } from "#db";
import { Command } from "#structures";
import { FM_ICON, TF_ICON } from "#util";

function displayRoleMembers(role: Role) {
    let content = role.toString() + "\n";

    content += role.members.sort(sortMembers).map(member => member.toString()).join("\n") || "None";

    return content;
}

function sortMembers(a: GuildMember, b: GuildMember) {
    if (a.displayName.toLowerCase() < b.displayName.toLowerCase()) return -1;
    if (a.displayName.toLowerCase() > b.displayName.toLowerCase()) return 1;

    return 0;
}

export default new Command<"chatInput">({
    async run(interaction) {
        const embed = new EmbedBuilder().setColor(interaction.client.config.EMBED_COLOR);

        switch (interaction.options.getSubcommand()) {
            case "mp": {
                let mpStaffContent = displayRoleMembers(interaction.client.getRole("mpManager")) + "\n\n";

                mpStaffContent += displayRoleMembers(interaction.client.getRole("mpSrAdmin")) + "\n\n";
                mpStaffContent += displayRoleMembers(interaction.client.getRole("mpJrAdmin")) + "\n\n";
                mpStaffContent += displayRoleMembers(interaction.client.getRole("mpFarmManager"));

                embed.setTitle("__MP Staff Members__");

                embed.addFields([
                    { name: "", inline: true, value: mpStaffContent },
                    { name: "", inline: true, value: displayRoleMembers(interaction.client.getRole("trustedFarmer")) }
                ]);

                break;
            };
            case "fs": {
                const fmNames = (await db.select().from(fmNamesTable)).map(x => x.name).join("`\n`");
                const tfNames = (await db.select().from(tfNamesTable)).map(x => x.name).join("`\n`");

                embed
                    .setTitle("__MP Staff Usernames__")
                    .addFields(
                        { name: `Farm Managers ${FM_ICON}`, value: inlineCode(fmNames), inline: true },
                        { name: `Trusted Farmers ${TF_ICON}`, value: inlineCode(tfNames), inline: true }
                    );

                break;
            };
            case "discord": {
                let discordStaffContent = displayRoleMembers(interaction.client.getRole("discordAdmin")) + "\n\n";

                discordStaffContent += displayRoleMembers(interaction.client.getRole("discordModerator")) + "\n\n";
                discordStaffContent += displayRoleMembers(interaction.client.getRole("discordHelper"));

                embed.setTitle("__Discord Staff Members__").setDescription(discordStaffContent);

                break;
            };
            case "mc": {
                embed
                    .setTitle("__IRTMC Staff Members__")
                    .setDescription(displayRoleMembers(interaction.client.getRole("irtmcStaff")));

                break;
            }
        };

        await interaction.reply({ embeds: [embed] });
    },
    data: {
        name: "staff",
        description: "Staff member information",
        options: [
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "mp",
                description: "Shows all MP Staff members within Discord"
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "fs",
                description: "Shows all MP Staff usernames within FS"
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "discord",
                description: "Shows all Discord Staff members"
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "mc",
                description: "Shows all MC Staff members"
            },
        ]
    }
});
