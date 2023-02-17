import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const msg = await interaction.reply({content: "Pinging...", fetchReply: true});
        const time = msg.createdTimestamp - interaction.createdTimestamp;
        msg.edit({content: `Websocket: \`${client.ws.ping}\`ms\nBot: \`${time}\`ms`});
    },
    data: new SlashCommandBuilder().setName("ping").setDescription("Get the bot's latency")
};