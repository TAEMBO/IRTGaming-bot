interface mpStaff {
    mp_manager: Discord.Role,
    mp_admin: Discord.Role,
    mp_publicadmin: Discord.Role,
    mp_farmmanager: Discord.Role,
    mp_trustedfarmer: Discord.Role
}
interface dcStaff {
    moderator: Discord.Role,
    helper: Discord.Role
}


import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const subCmd = interaction.options.getSubcommand();

        if (subCmd === 'mp') {
            const staff: mpStaff = {
                mp_manager: await interaction.guild.roles.fetch(client.config.mainServer.roles.mpmanager) as Discord.Role,
                mp_admin: await interaction.guild.roles.fetch(client.config.mainServer.roles.mpadmin) as Discord.Role,
                mp_publicadmin: await interaction.guild.roles.fetch(client.config.mainServer.roles.mppublicadmin) as Discord.Role,
                mp_farmmanager: await interaction.guild.roles.fetch(client.config.mainServer.roles.mpfarmmanager) as Discord.Role,
                mp_trustedfarmer: await interaction.guild.roles.fetch(client.config.mainServer.roles.trustedfarmer) as Discord.Role
            };
            const mp_m = await staff.mp_manager.members.map(e=>`<@${e.user.id}>`).join("\n") || "None";
            const mp_a = await staff.mp_admin.members.filter(x=>!x.roles.cache.has(client.config.mainServer.roles.mpmanager)).map(e=>`<@${e.user.id}>`).join("\n") || "None";
            const mp_pa = await staff.mp_publicadmin.members.map(e=>`<@${e.user.id}>`).join("\n") || "None";
            const mp_fm = await staff.mp_farmmanager.members.map(e=>`<@${e.user.id}>`).join("\n") || "None";
            const mp_tf = await staff.mp_trustedfarmer.members.filter(x=>!client.isMPStaff(x)).map(e=>`<@${e.user.id}>`).join("\n") || "None";
     
            const embed = new client.embed()
                .setTitle('__MP Staff Members__')
                .setDescription(`<@&${client.config.mainServer.roles.mpmanager}>\n${mp_m}\n\n<@&${client.config.mainServer.roles.mpadmin}>\n${mp_a}\n\n<@&${client.config.mainServer.roles.mppublicadmin}>\n${mp_pa}\n\n<@&${client.config.mainServer.roles.mpfarmmanager}>\n${mp_fm}\n\n__**Trusted Farmers**__\n<@&${client.config.mainServer.roles.trustedfarmer}>\n${mp_tf}`)
                .setColor(client.config.embedColor)
            interaction.reply({embeds: [embed]})

        } else if (subCmd === 'fs') {
            const embed = new client.embed()
                .setTitle("__MP Staff Usernames__")
                .addFields(
                    {name: 'Farm Managers :farmer:', value: `\`${client.FMstaff._content.map((x: string)=>x).join("\`\n\`")}\``},
                    {name: 'Trusted Farmers :angel:', value: `\`${client.TFstaff._content.map((x: string)=>x).join("\`\n\`")}\``}
                )
                .setColor(client.config.embedColor)
            interaction.reply({embeds: [embed]})
        } else if (subCmd === 'discord') {
            const staff: dcStaff = {
                moderator: await interaction.guild.roles.fetch(client.config.mainServer.roles.mod) as Discord.Role,
                helper: await interaction.guild.roles.fetch(client.config.mainServer.roles.helper) as Discord.Role
            };
            const mod = await staff.moderator.members.filter(x=>!x.roles.cache.has(client.config.mainServer.roles.helper)).map(e=>`<@${e.user.id}>`).join("\n") || "None";
            const helper = await staff.helper.members.map(e=>`<@${e.user.id}>`).join("\n") || "None";
     
            const embed = new client.embed()
                .setTitle('__Discord Staff Members__')
                .setDescription(`<@&${client.config.mainServer.roles.mod}>\n${mod}\n\n<@&${client.config.mainServer.roles.helper}>\n${helper}`)
                .setColor(client.config.embedColor)
            interaction.reply({embeds: [embed]});
        }
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