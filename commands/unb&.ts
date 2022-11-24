import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const member = interaction.options.getUser("user");
        interaction.reply({content: "ok", ephemeral: true})
        if(!member){
            return (interaction.channel as Discord.TextChannel).send({content: `Your honorary ban has been revoked!`});
        } else {
            return (interaction.channel as Discord.TextChannel).send({content: `<@${member.id}> had their honorary ban revoked!`})}
    },
    data: new SlashCommandBuilder()
        .setName("unband")
        .setDescription("Revokes an honorary ban.")
        .addUserOption((opt)=>opt
            .setName("user")
            .setDescription("It's an honor")
            .setRequired(false))
};
