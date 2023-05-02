import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const member = interaction.options.getMember('member');
        let reason = interaction.options.getString('reason', false);

        if (!member) return interaction.reply({ content: 'You cannot bonk someone who\'s not in the server!', ephemeral: true });
        if (reason?.startsWith('for ')) reason = reason.replace('for ', '');

        interaction.reply({embeds: [new client.embed()
            .setColor(client.config.embedColor)
            .setTitle([
                interaction.user.username,
                ' bonked ',
                interaction.user.id === member.id ? 'themselves' : member.user.username,
                '\nfor ',
                reason ?? 'no reason',
                '!'
            ].join(''))
            .setThumbnail('https://cdn.discordapp.com/emojis/764425143304847370.png')
        ]});
	},
	data: new SlashCommandBuilder()
		.setName("bonk")
		.setDescription("Bonk someone")
		.addUserOption(x=>x
			.setName("member")
			.setDescription("The member to bonk")
			.setRequired(true))
        .addStringOption(x=>x
            .setName('reason')
            .setDescription('The reason for bonking the member')
            .setRequired(false))
};
