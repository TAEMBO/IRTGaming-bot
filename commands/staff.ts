import { SlashCommandBuilder, EmbedBuilder, GuildMember } from 'discord.js';
import { Index, TInteraction } from '../typings.js';

export default {
	async run(interaction: TInteraction) {
        function sortMembers(a: GuildMember, b: GuildMember) {
            if (a.displayName.toLowerCase() < b.displayName.toLowerCase()) return -1;
            if (a.displayName.toLowerCase() > b.displayName.toLowerCase()) return 1;
            return 0;
        };
        
        await ({
            async mp() {
                const staff = {
                    mp_manager: interaction.client.getRole('mpmanager'),
                    mp_sr_admin: interaction.client.getRole('mpsradmin'),
                    mp_jr_admin: interaction.client.getRole('mpjradmin'),
                    mp_farm_manager: interaction.client.getRole('mpfarmmanager'),
                    mp_trusted_farmer: interaction.client.getRole('trustedfarmer')
                };
         
                await interaction.reply({ embeds: [new EmbedBuilder()
                    .setTitle('__MP Staff Members__')
                    .setColor(interaction.client.config.embedColor)
                    .setDescription([
                        staff.mp_manager.toString(),
                        staff.mp_manager.members.sort(sortMembers).map(x => x.toString()).join("\n") || "None",
                        '',
                        staff.mp_sr_admin.toString(),
                        staff.mp_sr_admin.members.sort(sortMembers).map(x => x.toString()).join("\n") || "None",
                        '',
                        staff.mp_jr_admin.toString(),
                        staff.mp_jr_admin.members.sort(sortMembers).map(x => x.toString()).join("\n") || "None",
                        '',
                        staff.mp_farm_manager.toString(),
                        staff.mp_farm_manager.members.sort(sortMembers).map(x => x.toString()).join("\n") || "None",
                        '',
                        staff.mp_trusted_farmer.toString(),
                        staff.mp_trusted_farmer.members.sort(sortMembers).map(x => x.toString()).join("\n") || "None"
                    ].join('\n'))
                ] });
            },
            async fs() {
                await interaction.reply({ embeds: [new EmbedBuilder()
                    .setTitle('__MP Staff Usernames__')
                    .setColor(interaction.client.config.embedColor)
                    .addFields(
                        { name: 'Farm Managers :farmer:', value: `\`${interaction.client.fmList.data.join("\`\n\`")}\`` },
                        { name: 'Trusted Farmers :angel:', value: `\`${interaction.client.tfList.data.join("\`\n\`")}\`` }
                    )
                ] });
            },
            async discord() {
                const staff = {
                    admin: interaction.client.getRole('discordadmin'),
                    moderator: interaction.client.getRole('discordmoderator'),
                    helper: interaction.client.getRole('discordhelper')
                };
         
                await interaction.reply({ embeds: [new EmbedBuilder()
                    .setTitle('__Discord Staff Members__')
                    .setColor(interaction.client.config.embedColor)
                    .setDescription([
                        staff.admin.toString(),
                        staff.admin.members.sort(sortMembers).map(x => x.toString()).join("\n") || "None",
                        '',
                        staff.moderator.toString(),
                        staff.moderator.members.sort(sortMembers).map(x => x.toString()).join("\n") || "None",
                        '',
                        staff.helper.toString(),
                        staff.helper.members.sort(sortMembers).map(x => x.toString()).join("\n") || "None"
                    ].join('\n'))
                ] });
            },
            async mc() {
                const staff = interaction.client.getRole('irtmcstaff');

                await interaction.reply({ embeds: [new EmbedBuilder()
                    .setTitle('__IRTMC Staff Members__')
                    .setColor(interaction.client.config.embedColor)
                    .setDescription(`${staff.toString()}\n${staff.members.sort(sortMembers).map(x => x.toString()).join("\n") || "None"}`)
                ] });
            }
        } as Index)[interaction.options.getSubcommand()]();
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
};
