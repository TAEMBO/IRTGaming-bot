import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        ({
            mp: async () => {
                const staff = {
                    mp_manager: (await interaction.guild.roles.fetch(client.config.mainServer.roles.mpmanager) as Discord.Role).members.map(e=>e.toString()).join("\n") || "None",
                    mp_sr_admin: (await interaction.guild.roles.fetch(client.config.mainServer.roles.mpsradmin) as Discord.Role).members.filter(x=>!x.roles.cache.has(client.config.mainServer.roles.mpmanager)).map(e=>e.toString()).join("\n") || "None",
                    mp_jr_admin: (await interaction.guild.roles.fetch(client.config.mainServer.roles.mpjradmin) as Discord.Role).members.map(e=>e.toString()).join("\n") || "None",
                    mp_farm_manager: (await interaction.guild.roles.fetch(client.config.mainServer.roles.mpfarmmanager) as Discord.Role).members.map(e=>e.toString()).join("\n") || "None",
                    mp_trusted_farmer: (await interaction.guild.roles.fetch(client.config.mainServer.roles.trustedfarmer) as Discord.Role).members.filter(x=>!client.isMPStaff(x)).map(e=>e.toString()).join("\n") || "None"
                };
         
                interaction.reply({embeds: [new client.embed()
                    .setTitle('__MP Staff Members__')
                    .setColor(client.config.embedColor)
                    .setDescription([
                        `<@&${client.config.mainServer.roles.mpmanager}>`,
                        `${staff.mp_manager}\n`,
                        `<@&${client.config.mainServer.roles.mpsradmin}>`,
                        `${staff.mp_sr_admin}\n`,
                        `<@&${client.config.mainServer.roles.mpjradmin}>`,
                        `${staff.mp_jr_admin}\n`,
                        `<@&${client.config.mainServer.roles.mpfarmmanager}>`,
                        `${staff.mp_farm_manager}\n`,
                        `<@&${client.config.mainServer.roles.trustedfarmer}>`,
                        `${staff.mp_trusted_farmer}`
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
                    admin: (await interaction.guild.roles.fetch(client.config.mainServer.roles.admin) as Discord.Role).members.map(e=>e.toString()).join("\n") || "None",
                    moderator: (await interaction.guild.roles.fetch(client.config.mainServer.roles.discordmoderator) as Discord.Role).members.filter(x=>!x.roles.cache.has(client.config.mainServer.roles.admin)).map(e=>e.toString()).join("\n") || "None",
                    helper: (await interaction.guild.roles.fetch(client.config.mainServer.roles.discordhelper) as Discord.Role).members.map(e=>e.toString()).join("\n") || "None"
                };
         
                interaction.reply({embeds: [new client.embed()
                    .setTitle('__Discord Staff Members__')
                    .setColor(client.config.embedColor)
                    .setDescription([
                        `<@&${client.config.mainServer.roles.admin}>`,
                        `${staff.admin}\n`,
                        `<@&${client.config.mainServer.roles.discordmoderator}>`,
                        `${staff.moderator}\n`,
                        `<@&${client.config.mainServer.roles.discordhelper}>`,
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