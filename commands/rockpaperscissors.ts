import Discord, { SlashCommandBuilder } from 'discord.js';
import { YClient } from '../client';
const rpsChannels: any = {};
class RpsInstance {
    firstPlayer: Discord.User;
    firstMove: string;
    message: Discord.Message;
    constructor(client: YClient, firstPlayer: Discord.User, firstMove: string, message: Discord.Message) {
        this.firstPlayer = firstPlayer;
        this.firstMove = firstMove;
        this.message = message;
        this.timeOut(client, message);
    }

    async timeOut(client: YClient, message: Discord.Message){
        setTimeout(async () => {
            if (rpsChannels.hasOwnProperty(message.channel.id)) {
                await this.message.edit({embeds: [], content: "This rock paper scissors game has ended due to inactivity."});
                delete rpsChannels[message.channel.id];
                client.games.delete(message.channel.id);
            }
        }, 60000);
    }
}

// Credits to Memw#6969
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const move = interaction.options.getString("move") as string;
        if(!rpsChannels.hasOwnProperty((interaction.channel as Discord.TextChannel).id) && !client.games.has((interaction.channel as Discord.TextChannel).id)){
            client.games.set((interaction.channel as Discord.TextChannel).id, interaction.user.tag);
            await interaction.deferReply();
            const embed = new client.embed()
                .setTitle("Rps game started")
                .setDescription(`To play with <@${interaction.user.id}> run the command again.`)
                .setFooter({text: "You have 60 seconds to reply with another interaction."});
            await interaction.deleteReply();
            const message = await (interaction.channel as Discord.TextChannel).send({embeds: [embed]});
            rpsChannels[(interaction.channel as Discord.TextChannel).id] = new RpsInstance(client, interaction.user, move, message);
        }else if (rpsChannels.hasOwnProperty((interaction.channel as Discord.TextChannel).id) && client.games.has((interaction.channel as Discord.TextChannel).id)){
            let firstMove = rpsChannels[(interaction.channel as Discord.TextChannel).id];
            if(interaction.user.id === firstMove.firstPlayer.id){
                await interaction.reply({content: "You can't play with yourself."});
            }else{
                await interaction.deferReply();
                let winner = null;
                if(move === 'rock') if(firstMove.firstMove === 'paper') winner = firstMove.firstPlayer; else winner = interaction.user;
                if(move === 'scissors') if(firstMove.firstMove === 'rock') winner = firstMove.firstPlayer; else winner = interaction.user;
                if(move === 'paper') if(firstMove.firstMove === 'scissors') winner = firstMove.firstPlayer; else winner = interaction.user;
                if(move === firstMove.firstMove) winner = null;
                const embed = new client.embed()
                    .setTitle("Rps game ended")
                    .setDescription(`Both players sent their move.\n**${firstMove.firstPlayer.tag}:** ${firstMove.firstMove}\n**${interaction.user.tag}:** ${move}`)
                    .setFooter({text: `This game has ended, ${winner !== null ? `${winner.tag} won.` : `it's a tie.`}`});
                await firstMove.message.edit({embeds: [embed]});
                delete rpsChannels[(interaction.channel as Discord.TextChannel).id];
                client.games.delete((interaction.channel as Discord.TextChannel).id);
                await interaction.deleteReply();
            }
        }else{
            await interaction.reply({content: "You can't start 2 different games in the same channel, go to another channel or wait for the current game to end.", ephemeral: true});
        }
    },
    data: new SlashCommandBuilder()
        .setName("rps")
        .setDescription("Start a rock paper scissors game.")
        .addStringOption(opt => opt
			.setName("move")
			.setDescription("Your move")
			.addChoices(
				{name: "Rock", value: "rock"},
				{name: "Paper", value: "paper"},
				{name: "Scissors", value: "scissors"})
			.setRequired(true))
}
