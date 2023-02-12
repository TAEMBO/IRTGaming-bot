import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        if (interaction.channel?.parentId !== '980947706736427019' && !client.isMPStaff(interaction.member)) return interaction.reply({content: 'You cannot use this command here', ephemeral: true});

        interaction.reply({embeds: [new client.embed()
            .setTitle('MP Support - Ban Appeal')
            .setColor(client.config.embedColor)
            .setDescription([
                'To appeal a ban on one of our FS servers, please provide the following information:',
                '<:IRTDot:908818924286648350> In-game name at the time of being banned',
                '<:IRTDot:908818924286648350> Rough time and date',
                '<:IRTDot:908818924286648350> Server name (Public Silage or Public Grain)',
                '<:IRTDot:908818924286648350> What you were doing at the time of being banned',
                '<:IRTDot:908818924286648350> Anything else which could help with the appeal',
                '\u200b',
                'Once you have done so, we will review your ban as soon as possible. Please be patient as we may have to wait for staff in other time zones before making a decision.'
            ].join('\n'))
        ]})
    },
    data: new SlashCommandBuilder()
        .setName("appeal")
        .setDescription("Appeal an MP ban")
};