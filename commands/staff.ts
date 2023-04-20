import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        ({
            mp: async () => {
                const staff = {
                    mp_manager: await interaction.guild.roles.fetch(client.config.mainServer.roles.mpmanager) as Discord.Role,
                    mp_admin: await interaction.guild.roles.fetch(client.config.mainServer.roles.mpsradmin) as Discord.Role,
                    mp_publicadmin: await interaction.guild.roles.fetch(client.config.mainServer.roles.mpjradmin) as Discord.Role,
                    mp_farmmanager: await interaction.guild.roles.fetch(client.config.mainServer.roles.mpfarmmanager) as Discord.Role,
                    mp_trustedfarmer: await interaction.guild.roles.fetch(client.config.mainServer.roles.trustedfarmer) as Discord.Role
                };
                const mp_m = staff.mp_manager.members.map(e=>`<@${e.user.id}>`).join("\n") || "None";
                const mp_a = staff.mp_admin.members.filter(x=>!x.roles.cache.has(client.config.mainServer.roles.mpmanager)).map(e=>`<@${e.user.id}>`).join("\n") || "None";
                const mp_pa = staff.mp_publicadmin.members.map(e=>`<@${e.user.id}>`).join("\n") || "None";
                const mp_fm = staff.mp_farmmanager.members.map(e=>`<@${e.user.id}>`).join("\n") || "None";
                const mp_tf = staff.mp_trustedfarmer.members.filter(x=>!client.isMPStaff(x)).map(e=>`<@${e.user.id}>`).join("\n") || "None";
         
                interaction.reply({embeds: [new client.embed()
                    .setTitle('__MP Staff Members__')
                    .setColor(client.config.embedColor)
                    .setDescription([
                        `<@&${client.config.mainServer.roles.mpmanager}>`,
                        `${mp_m}\n`,
                        `<@&${client.config.mainServer.roles.mpsradmin}>`,
                        `${mp_a}\n`,
                        `<@&${client.config.mainServer.roles.mpjradmin}>`,
                        `${mp_pa}\n`,
                        `<@&${client.config.mainServer.roles.mpfarmmanager}>`,
                        `${mp_fm}\n`,
                        `<@&${client.config.mainServer.roles.trustedfarmer}>`,
                        `${mp_tf}`
                    ].join('\n'))
                ]});
            },
            fs: () => {
                interaction.reply({embeds: [new client.embed()
                    .setTitle('__MP Staff Usernames__')
                    .setColor(client.config.embedColor)
                    .addFields(
                        { name: 'Farm Managers :farmer:', value: `\`${client.FMlist._content.join("\`\n\`")}\`` },
                        { name: 'Trusted Farmers :angel:', value: `\`${client.TFlist._content.join("\`\n\`")}\`` })
                ]});
            },
            discord: async () => {
                const staff = {
                    moderator: await interaction.guild.roles.fetch(client.config.mainServer.roles.discordmoderator) as Discord.Role,
                    helper: await interaction.guild.roles.fetch(client.config.mainServer.roles.discordhelper) as Discord.Role
                };
                const mod = staff.moderator.members.filter(x=>!x.roles.cache.has(client.config.mainServer.roles.discordhelper)).map(e=>`<@${e.user.id}>`).join("\n") || "None";
                const helper = staff.helper.members.map(e=>`<@${e.user.id}>`).join("\n") || "None";
         
                interaction.reply({embeds: [new client.embed()
                    .setTitle('__Discord Staff Members__')
                    .setColor(client.config.embedColor)
                    .setDescription([
                        `<@&${client.config.mainServer.roles.discordmoderator}>`,
                        `${mod}\n`,
                        `<@&${client.config.mainServer.roles.discordhelper}>`,
                        `${helper}`
                    ].join('\n'))
                ]});
            }
        } as any)[interaction.options.getSubcommand()]();
    },
    data: new SlashCommandBuilder()
        .setName("staff")
        .setDescription("Staff member information")
        .addSubcommand((optt)=>optt
            .setName("mp")
            .setDescription("Shows all MP Staff members within Discord"))
        .addSubcommand((optt)=>optt
            .setName("fs")
            .setDescription("Shows all MP Staff usernames within FS"))
        .addSubcommand((optt)=>optt
            .setName("discord")
            .setDescription("Shows all Discord staff members"))
};