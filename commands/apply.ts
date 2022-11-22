import Discord, { SlashCommandBuilder } from 'discord.js';
import { YClient } from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const channel = client.channels.resolve('811341461223112714') as Discord.TextChannel;
        if ((Date.now() - (interaction.member.joinedTimestamp as number)) < 604800000) {
            interaction.reply({content: 'You must be on the Discord server for at least two weeks before applying.', ephemeral: true})
            channel.send(`<@${interaction.user.id}> (${interaction.user.tag}) tried to open an MP Staff application but was rejected due to insufficient time.`)
            return;
        }

        interaction.reply({content: 'https://forms.gle/JivS14vJgcJCKigq7', ephemeral: true})
        channel.send(`<@${interaction.user.id}> (${interaction.user.tag}) opened an MP Staff application at <t:${Math.round(Date.now() / 1000)}>\nForm: <https://forms.gle/JivS14vJgcJCKigq7>`)
    },
    data: new SlashCommandBuilder()
        .setName("apply")
        .setDescription("Apply for MP Staff")
};