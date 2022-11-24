import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const member = interaction.options.getUser("user") as Discord.User;
        interaction.reply({content: "ok", ephemeral: true});
        if (!member) {
            (interaction.channel as Discord.TextChannel).send('You received an honorary ban!')
            return;
        } else {
            (interaction.channel as Discord.TextChannel).send(`<@${member.id}> has received an honorary ban!`)}
        return;
    },
    data: new SlashCommandBuilder()
        .setName("band")
        .setDescription("Honorary ban")
        .addUserOption((opt)=>opt
            .setName("user")
            .setDescription("It's an honor")
            .setRequired(false))
};
