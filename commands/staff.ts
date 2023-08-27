import { SlashCommandBuilder, EmbedBuilder, GuildMember } from 'discord.js';
import { TInteraction } from '../typings.js';

export default {
	async run(interaction: TInteraction) {
        const allRoles = interaction.client.config.mainServer.roles;

        function sortMembers(a: GuildMember, b: GuildMember) {
            if (a.displayName.toLowerCase() < b.displayName.toLowerCase()) return -1;
            if (a.displayName.toLowerCase() > b.displayName.toLowerCase()) return 1;
            return 0;
        };
        
        ({
            mp: async () => {
                const staff = {
                    mp_manager: interaction.guild.roles.cache.get(allRoles.mpmanager)?.members.sort(sortMembers),
                    mp_sr_admin: interaction.guild.roles.cache.get(allRoles.mpsradmin)?.members.sort(sortMembers),
                    mp_jr_admin: interaction.guild.roles.cache.get(allRoles.mpjradmin)?.members.sort(sortMembers),
                    mp_farm_manager: interaction.guild.roles.cache.get(allRoles.mpfarmmanager)?.members.sort(sortMembers),
                    mp_trusted_farmer: interaction.guild.roles.cache.get(allRoles.trustedfarmer)?.members.sort(sortMembers)
                };
         
                interaction.reply({ embeds: [new EmbedBuilder()
                    .setTitle('__MP Staff Members__')
                    .setColor(interaction.client.config.embedColor)
                    .setDescription([
                        `<@&${allRoles.mpmanager}>`,
                        `${staff.mp_manager?.map(x => x.toString()).join("\n") || "None"}\n`,
                        `<@&${allRoles.mpsradmin}>`,
                        `${staff.mp_sr_admin?.map(x => x.toString()).join("\n") || "None"}\n`,
                        `<@&${allRoles.mpjradmin}>`,
                        `${staff.mp_jr_admin?.map(x => x.toString()).join("\n") || "None"}\n`,
                        `<@&${allRoles.mpfarmmanager}>`,
                        `${staff.mp_farm_manager?.map(x => x.toString()).join("\n") || "None"}\n`,
                        `<@&${allRoles.trustedfarmer}>`,
                        `${staff.mp_trusted_farmer?.map(x => x.toString()).join("\n") || "None"}`
                    ].join('\n'))
                ] });
            },
            fs: () => {
                interaction.reply({ embeds: [new EmbedBuilder()
                    .setTitle('__MP Staff Usernames__')
                    .setColor(interaction.client.config.embedColor)
                    .addFields(
                        { name: 'Farm Managers :farmer:', value: `\`${interaction.client.fmList.data.join("\`\n\`")}\`` },
                        { name: 'Trusted Farmers :angel:', value: `\`${interaction.client.tfList.data.join("\`\n\`")}\`` }
                    )
                ] });
            },
            discord: async () => {
                const staff = {
                    admin: interaction.guild.roles.cache.get(allRoles.discordadmin)?.members,
                    moderator: interaction.guild.roles.cache.get(allRoles.discordmoderator)?.members,
                    helper: interaction.guild.roles.cache.get(allRoles.discordhelper)?.members
                };
         
                interaction.reply({ embeds: [new EmbedBuilder()
                    .setTitle('__Discord Staff Members__')
                    .setColor(interaction.client.config.embedColor)
                    .setDescription([
                        `<@&${allRoles.discordadmin}>`,
                        `${staff.admin?.map(x => x.toString()).join("\n") || "None"}\n`,
                        `<@&${allRoles.discordmoderator}>`,
                        `${staff.moderator?.map(x => x.toString()).join("\n") || "None"}\n`,
                        `<@&${allRoles.discordhelper}>`,
                        `${staff.helper?.map(x => x.toString()).join("\n") || "None"}`
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
