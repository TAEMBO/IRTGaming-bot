import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { TInteraction } from '../typings.js';
import { hasRole, isMPStaff } from '../utilities.js';

export default {
	async run(interaction: TInteraction) {
        const allRoles = interaction.client.config.mainServer.roles;

        ({
            mp: async () => {
                const staff = {
                    mp_manager: interaction.guild.roles.cache.get(allRoles.mpmanager)?.members.map(x => x.toString()).join("\n") || "None",
                    mp_sr_admin: interaction.guild.roles.cache.get(allRoles.mpsradmin)?.members.map(x => x.toString()).join("\n") || "None",
                    mp_jr_admin: interaction.guild.roles.cache.get(allRoles.mpjradmin)?.members.map(x => x.toString()).join("\n") || "None",
                    mp_farm_manager: interaction.guild.roles.cache.get(allRoles.mpfarmmanager)?.members.map(x => x.toString()).join("\n") || "None",
                    mp_trusted_farmer: interaction.guild.roles.cache.get(allRoles.trustedfarmer)?.members.filter(x => !isMPStaff(x)).map(x => x.toString()).join("\n") || "None"
                };
         
                interaction.reply({ embeds: [new EmbedBuilder()
                    .setTitle('__MP Staff Members__')
                    .setColor(interaction.client.config.embedColor)
                    .setDescription([
                        `<@&${allRoles.mpmanager}>`,
                        `${staff.mp_manager}\n`,
                        `<@&${allRoles.mpsradmin}>`,
                        `${staff.mp_sr_admin}\n`,
                        `<@&${allRoles.mpjradmin}>`,
                        `${staff.mp_jr_admin}\n`,
                        `<@&${allRoles.mpfarmmanager}>`,
                        `${staff.mp_farm_manager}\n`,
                        `<@&${allRoles.trustedfarmer}>`,
                        `${staff.mp_trusted_farmer}`
                    ].join('\n'))
                ] });
            },
            fs: () => {
                interaction.reply({ embeds: [new EmbedBuilder()
                    .setTitle('__MP Staff Usernames__')
                    .setColor(interaction.client.config.embedColor)
                    .addFields(
                        { name: 'Farm Managers :farmer:', value: `\`${interaction.client.FMlist._content.join("\`\n\`")}\`` },
                        { name: 'Trusted Farmers :angel:', value: `\`${interaction.client.TFlist._content.join("\`\n\`")}\`` }
                    )
                ] });
            },
            discord: async () => {
                const staff = {
                    admin: interaction.guild.roles.cache.get(allRoles.admin)?.members.map(x => x.toString()).join("\n") || "None",
                    moderator: interaction.guild.roles.cache.get(allRoles.discordmoderator)?.members.filter(x => !hasRole(x, 'admin')).map(x => x.toString()).join("\n") || "None",
                    helper: interaction.guild.roles.cache.get(allRoles.discordhelper)?.members.map(x => x.toString()).join("\n") || "None"
                };
         
                interaction.reply({ embeds: [new EmbedBuilder()
                    .setTitle('__Discord Staff Members__')
                    .setColor(interaction.client.config.embedColor)
                    .setDescription([
                        `<@&${allRoles.admin}>`,
                        `${staff.admin}\n`,
                        `<@&${allRoles.discordmoderator}>`,
                        `${staff.moderator}\n`,
                        `<@&${allRoles.discordhelper}>`,
                        `${staff.helper}`
                    ].join('\n'))
                ] });
            }
        } as any)[interaction.options.getSubcommand()]();
    },
    data: new SlashCommandBuilder()
        .setName("staff")
        .setDescription("Staff member information")
        .addSubcommand(x=>x
            .setName("mp")
            .setDescription("Shows all MP Staff members within Discord"))
        .addSubcommand(x=>x
            .setName("fs")
            .setDescription("Shows all MP Staff usernames within FS"))
        .addSubcommand(x=>x
            .setName("discord")
            .setDescription("Shows all Discord staff members"))
};