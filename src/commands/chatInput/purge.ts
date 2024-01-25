import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../utils.js";

export default new Command<"chatInput">({
	async run(interaction) {
        const limit = interaction.options.getInteger("amount", true);
        const user = interaction.options.getUser("user");
        const msgs = await (async () => {
            if (user) {
                return (await interaction.channel!.messages.fetch({ limit })).filter(x => x.author.id === user.id);
            } else return await interaction.channel!.messages.fetch({ limit });
        })();

        await interaction.channel!.bulkDelete(msgs, true);
        await interaction.reply({ content: `Successfully deleted ${msgs.size} messages${user ? ` from ${user}` : ''}.`, ephemeral: true });
	},
	data: new SlashCommandBuilder()
		.setName("purge")
		.setDescription("Purges messages in this channel")
		.addIntegerOption(x => x
			.setName("amount")
			.setDescription("The amount of messages to purge")
			.setRequired(true)
            .setMaxValue(100))
		.addUserOption(x => x
			.setName("user")
			.setDescription("The user to purge messages from")
			.setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
});
