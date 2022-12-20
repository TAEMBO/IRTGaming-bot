import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const subCmd = interaction.options.getSubcommand();
        if (subCmd === 'verify') {
            const channel = client.channels.resolve('849993619267911680') as Discord.TextChannel;
            const pic = interaction.options.getAttachment('image') as Discord.Attachment;
            channel.send({content: `<@${interaction.user.id}> (${interaction.user.tag}) Subscriber role verification`, files: [pic]});
            interaction.reply({content: `Verification sent, please wait for someone to verify your subscription. You will then receive the <@&${client.config.mainServer.roles.subscriber}> role.`, ephemeral: true})
        } else if (subCmd === 'accept') {
            if (!client.hasModPerms(interaction.member)) return client.youNeedRole(interaction, "mod");
            const member = interaction.options.getMember("member") as Discord.GuildMember;
            member.roles.add(client.config.mainServer.roles.subscriber)
            interaction.reply(`Role added to <@${member.user.id}>`)
        }
      },
    data: new SlashCommandBuilder()
    .setName("sub")
    .setDescription("Pull from GitHub repository to live bot")
    .addSubcommand((optt)=>optt
        .setName("verify")
        .setDescription("Verify your YT subscription to IRT")
        .addAttachmentOption(option => option
            .setName('image')
            .setDescription('Image proving subscription')
            .setRequired(true))
    )
    .addSubcommand((optt)=>optt
    .setName("accept")
    .setDescription("Staff only: accept a verification")
    .addUserOption((opt)=>opt
        .setName("member")
        .setDescription("The member to add the role to")
        .setRequired(true))
)
};
