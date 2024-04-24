import { EmbedBuilder, type GuildMember, SlashCommandBuilder } from "discord.js";
import { Command } from "../../structures/index.js";
import { lookup } from "../../util/index.js";

export default new Command<"chatInput">({
    async run(interaction) {
        function sortMembers(a: GuildMember, b: GuildMember) {
            if (a.displayName.toLowerCase() < b.displayName.toLowerCase()) return -1;
            if (a.displayName.toLowerCase() > b.displayName.toLowerCase()) return 1;
            return 0;
        }
        
        await lookup({
            async mp() {
                const staff = {
                    mp_manager: interaction.client.getRole("mpManager"),
                    mp_sr_admin: interaction.client.getRole("mpSrAdmin"),
                    mp_jr_admin: interaction.client.getRole("mpJrAdmin"),
                    mp_farm_manager: interaction.client.getRole("mpFarmManager"),
                    mp_trusted_farmer: interaction.client.getRole("trustedFarmer")
                };
         
                await interaction.reply({ embeds: [new EmbedBuilder()
                    .setTitle("__MP Staff Members__")
                    .setColor(interaction.client.config.EMBED_COLOR)
                    .setDescription([
                        staff.mp_manager.toString(),
                        staff.mp_manager.members.sort(sortMembers).map(x => x.toString()).join("\n") || "None",
                        "",
                        staff.mp_sr_admin.toString(),
                        staff.mp_sr_admin.members.sort(sortMembers).map(x => x.toString()).join("\n") || "None",
                        "",
                        staff.mp_jr_admin.toString(),
                        staff.mp_jr_admin.members.sort(sortMembers).map(x => x.toString()).join("\n") || "None",
                        "",
                        staff.mp_farm_manager.toString(),
                        staff.mp_farm_manager.members.sort(sortMembers).map(x => x.toString()).join("\n") || "None",
                        "",
                        staff.mp_trusted_farmer.toString(),
                        staff.mp_trusted_farmer.members.sort(sortMembers).map(x => x.toString()).join("\n") || "None"
                    ].join("\n"))
                ] });
            },
            async fs() {
                await interaction.reply({ embeds: [new EmbedBuilder()
                    .setTitle("__MP Staff Usernames__")
                    .setColor(interaction.client.config.EMBED_COLOR)
                    .addFields(
                        { name: "Farm Managers :farmer:", value: `\`${interaction.client.fmList.cache.join("`\n`")}\`` },
                        { name: "Trusted Farmers :angel:", value: `\`${interaction.client.tfList.cache.join("`\n`")}\`` }
                    )
                ] });
            },
            async discord() {
                const staff = {
                    admin: interaction.client.getRole("discordAdmin"),
                    moderator: interaction.client.getRole("discordModerator"),
                    helper: interaction.client.getRole("discordHelper")
                };
         
                await interaction.reply({ embeds: [new EmbedBuilder()
                    .setTitle("__Discord Staff Members__")
                    .setColor(interaction.client.config.EMBED_COLOR)
                    .setDescription([
                        staff.admin.toString(),
                        staff.admin.members.sort(sortMembers).map(x => x.toString()).join("\n") || "None",
                        "",
                        staff.moderator.toString(),
                        staff.moderator.members.sort(sortMembers).map(x => x.toString()).join("\n") || "None",
                        "",
                        staff.helper.toString(),
                        staff.helper.members.sort(sortMembers).map(x => x.toString()).join("\n") || "None"
                    ].join("\n"))
                ] });
            },
            async mc() {
                const staff = interaction.client.getRole("irtmcStaff");

                await interaction.reply({ embeds: [new EmbedBuilder()
                    .setTitle("__IRTMC Staff Members__")
                    .setColor(interaction.client.config.EMBED_COLOR)
                    .setDescription(`${staff.toString()}\n${staff.members.sort(sortMembers).map(x => x.toString()).join("\n") || "None"}`)
                ] });
            }
        }, interaction.options.getSubcommand());
    },
    data: new SlashCommandBuilder()
        .setName("staff")
        .setDescription("Staff member information")
        .addSubcommand(x => x
            .setName("mp")
            .setDescription("Shows all MP Staff members within Discord"))
        .addSubcommand(x => x
            .setName("fs")
            .setDescription("Shows all MP Staff usernames within FS"))
        .addSubcommand(x => x
            .setName("discord")
            .setDescription("Shows all Discord staff members"))
        .addSubcommand(x => x
            .setName("mc")
            .setDescription("Shows all IRTMC Staff members"))
});
