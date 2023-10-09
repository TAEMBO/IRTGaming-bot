import { SlashCommandBuilder } from 'discord.js';
import { TInteraction } from '../typings.js';
import { isDCStaff, youNeedRole } from '../utilities.js';

export default {
	async run(interaction: TInteraction) {
        const amount = interaction.options.getInteger("amount", true);
        const user = interaction.options.getUser("user");

		if (!isDCStaff(interaction.member)) return await youNeedRole(interaction, 'discordmoderator');
		if (amount > 100) return await interaction.reply({ content: 'Discord\'s API limits purging up to 100 messages.', ephemeral: true });

        const msgs = await (async () => {
            if (user) {
                return (await interaction.channel?.messages.fetch({ limit: amount }))?.filter(x => x.author.id === user.id);
            } else return await interaction.channel?.messages.fetch({ limit: amount });
        })();

        if (!msgs) return await interaction.reply({ content: 'Failed to fetch messages', ephemeral: true });

        await interaction.channel?.bulkDelete(msgs, true);

        await interaction.reply({ content: `Successfully deleted ${msgs.size} messages${user ? ` from ${user}` : ''}.`, ephemeral: true });
	},
	data: new SlashCommandBuilder()
		.setName("purge")
		.setDescription("Purges messages in this channel")
		.addIntegerOption(x => x
			.setName("amount")
			.setDescription("The amount of messages to purge")
			.setRequired(true))
		.addUserOption(x => x
			.setName("user")
			.setDescription("The user to purge messages from")
			.setRequired(false))
};
