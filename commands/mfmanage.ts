import Discord, { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        if(!interaction.member.roles.cache.has(client.config.mainServer.roles.mpmanager) && !interaction.member.roles.cache.has(client.config.mainServer.roles.mfmanager) && !interaction.member.roles.cache.has(client.config.mainServer.roles.mffarmowner)) return client.youNeedRole(interaction, "mffarmowner");
        const member = interaction.options.getMember("member") as Discord.GuildMember;
        const Role = client.config.mainServer.roles[interaction.options.getString("role") as string];

        if(member.roles.cache.has(Role)){
            if (interaction.member.roles.cache.has(client.config.mainServer.roles.mffarmowner) && !interaction.member.roles.cache.has(client.config.mainServer.roles.mfmanager) && !interaction.member.roles.cache.has(Role)) return interaction.reply('You cannot remove users from a farm you do not own.')
            const msg = await interaction.reply({embeds: [new client.embed().setDescription(`This user already has the <@&${Role}> role, do you want to remove it from them?`).setColor(client.config.embedColor)], fetchReply: true, components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId(`Yes`).setStyle(ButtonStyle.Success).setLabel("Confirm"), new ButtonBuilder().setCustomId(`No`).setStyle(ButtonStyle.Danger).setLabel("Cancel"))]});
            const filter = (i: any) => ["Yes", "No"].includes(i.customId) && i.user.id === interaction.user.id;
            const collector = (interaction.channel as Discord.TextChannel).createMessageComponentCollector({filter, max: 1, time: 30000});
            collector.on("collect", async (int: Discord.MessageComponentInteraction) => {
                if(int.customId === "Yes"){
                    member.roles.remove(Role);
                    member.roles.remove(client.config.mainServer.roles.mfmember);
                    int.update({embeds: [new client.embed().setDescription(`<@${member.user.id}> has been removed from the <@&${client.config.mainServer.roles.mfmember}> and <@&${Role}> roles.`).setColor(client.config.embedColor)], components: []})
                } else if(int.customId === "No"){
                    int.update({embeds: [new client.embed().setDescription(`Command canceled`).setColor(client.config.embedColor)], components: []});
                }
            });
        } else {
            if (interaction.member.roles.cache.has(client.config.mainServer.roles.mffarmowner) && !interaction.member.roles.cache.has(client.config.mainServer.roles.mfmanager) && !interaction.member.roles.cache.has(Role)) return interaction.reply('You cannot add users to a farm you do not own.')
            member.roles.add(Role);
            member.roles.add(client.config.mainServer.roles.mfmember);
            interaction.reply({embeds: [new client.embed().setDescription(`<@${member.user.id}> has been given the <@&${client.config.mainServer.roles.mfmember}> and <@&${Role}> roles.`).setColor(client.config.embedColor)]});
        }
	},
    data: new SlashCommandBuilder()
    .setName("mf")
    .setDescription("Manage MF members")
    .addUserOption((opt)=>opt
        .setName("member")
        .setDescription("The member to add or remove the role from")
        .setRequired(true))
    .addStringOption((opt)=>opt
        .setName("role")
        .setDescription("the role to add or remove")
        .addChoices(
            {name: 'Farm 1', value: 'mffarm1'},
            {name: 'Farm 2', value: 'mffarm2'},
            {name: 'Farm 3', value: 'mffarm3'},
            {name: 'Farm 4', value: 'mffarm4'},
            {name: 'Farm 5', value: 'mffarm5'},
            {name: 'Farm 6', value: 'mffarm6'},
            {name: 'Farm 7', value: 'mffarm7'},
            {name: 'Farm 8', value: 'mffarm8'},
            {name: 'Farm 9', value: 'mffarm9'},
            {name: 'Farm 10', value: 'mffarm10'},
            {name: 'Farm 11', value: 'mffarm11'}
        )
        .setRequired(true))
};
