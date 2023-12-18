import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { TInteraction } from '../../typings.js';

export default {
	async run(interaction: TInteraction) {
        const member = interaction.options.getMember('member');
        let reason = interaction.options.getString('reason', false);

        if (!member) return await interaction.reply({ content: 'You cannot bonk someone who\'s not in the server!', ephemeral: true });
        if (reason?.startsWith('for ')) reason = reason.replace('for ', '');

        await interaction.reply({ embeds: [new EmbedBuilder()
            .setColor(interaction.client.config.EMBED_COLOR)
            .setTitle([
                interaction.user.username,
                ' bonked ',
                interaction.user.id === member.id ? 'themselves' : member.user.username,
                '\nfor ',
                reason ?? 'no reason',
                '!'
            ].join(''))
            .setThumbnail(interaction.client.config.resources.bonkEmbedThumbnail)
        ] });
	},
	data: new SlashCommandBuilder()
		.setName("bonk")
		.setDescription("Bonk someone")
		.addUserOption(x => x
			.setName("member")
			.setDescription("The member to bonk")
			.setRequired(true))
        .addStringOption(x => x
            .setName('reason')
            .setDescription('The reason for bonking the member')
            .setRequired(false))
};
