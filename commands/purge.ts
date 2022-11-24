import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		if (!client.hasModPerms(interaction.member)) return client.youNeedRole(interaction, "mod");
		const amount = interaction.options.getInteger("amount") as number;
		if (amount > 100) return interaction.reply({content: 'Discord\'s API limits purging up to 100 messages.', ephemeral: true});
		const user = interaction.options.getUser("user");

        let messagesArray: Array<string> = [];

		if(user){
			(interaction.channel as Discord.TextChannel).messages.fetch({limit: 100}).then((msgs)=>{
				const msgList = msgs.filter(x => x.author.id === user.id);
				(interaction.channel as Discord.TextChannel).bulkDelete(msgList);
			})
		}else{
			(interaction.channel as Discord.TextChannel).messages.fetch({ limit: amount }).then(async messages => {
				messages.forEach(message => {
					messagesArray.push(message.id);
				});
				await (interaction.channel as Discord.TextChannel).bulkDelete(messagesArray);
			});
		}

			await interaction.reply({content: `Successfully deleted ${amount} messages.`, ephemeral: true});

	},
	data: new SlashCommandBuilder()
		.setName("purge")
		.setDescription("Purges messages in a channel.")
		.addIntegerOption((opt)=>opt
			.setName("amount")
			.setDescription("The amount of messages to purge.")
			.setRequired(true))
		.addUserOption((opt)=>opt
			.setName("user")
			.setDescription("The user to purge messages from.")
			.setRequired(false))
};
