import Discord, { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { TInteraction } from '../typings.js';
import { hasRole, isMPStaff } from '../utilities.js';

export default {
	async run(interaction: TInteraction) {
        const allRoles = interaction.client.config.mainServer.roles;

        ({
            mp: async () => {
                const staff = {
                    mp_manager: (await interaction.guild.roles.fetch(allRoles.mpmanager) as Discord.Role).members.map(e=>e.toString()).join("\n") || "None",
                    mp_sr_admin: (await interaction.guild.roles.fetch(allRoles.mpsradmin) as Discord.Role).members.filter(x=>!hasRole(x, 'mpmanager')).map(e=>e.toString()).join("\n") || "None",
                    mp_jr_admin: (await interaction.guild.roles.fetch(allRoles.mpjradmin) as Discord.Role).members.map(e=>e.toString()).join("\n") || "None",
                    mp_farm_manager: (await interaction.guild.roles.fetch(allRoles.mpfarmmanager) as Discord.Role).members.map(e=>e.toString()).join("\n") || "None",
                    mp_trusted_farmer: (await interaction.guild.roles.fetch(allRoles.trustedfarmer) as Discord.Role).members.filter(x=>!isMPStaff(x)).map(e=>e.toString()).join("\n") || "None"
                };
         
                interaction.reply({embeds: [new EmbedBuilder()
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
                ]});
            },
            fs: () => {
                interaction.reply({embeds: [new EmbedBuilder()
                    .setTitle('__MP Staff Usernames__')
                    .setColor(interaction.client.config.embedColor)
                    .addFields(
                        { name: 'Farm Managers :farmer:', value: `\`${interaction.client.FMlist._content.join("\`\n\`")}\`` },
                        { name: 'Trusted Farmers :angel:', value: `\`${interaction.client.TFlist._content.join("\`\n\`")}\`` })
                ]});
            },
            discord: async () => {
                const staff = {
                    admin: (await interaction.guild.roles.fetch(allRoles.admin) as Discord.Role).members.map(e=>e.toString()).join("\n") || "None",
                    moderator: (await interaction.guild.roles.fetch(allRoles.discordmoderator) as Discord.Role).members.filter(x=>!hasRole(x, 'admin')).map(e=>e.toString()).join("\n") || "None",
                    helper: (await interaction.guild.roles.fetch(allRoles.discordhelper) as Discord.Role).members.map(e=>e.toString()).join("\n") || "None"
                };
         
                interaction.reply({embeds: [new EmbedBuilder()
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
                ]});
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