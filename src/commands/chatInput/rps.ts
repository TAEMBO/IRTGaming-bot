import { SlashCommandBuilder, EmbedBuilder, User, Message } from 'discord.js';
import { TInteraction } from '../../typings.js';

const rpsChannels: Record<string, RpsInstance> = {};

class RpsInstance {
    to = (async () => setTimeout(async () => {
        if (!rpsChannels.hasOwnProperty(this.message.channelId)) return;
        
        await this.message.edit({ embeds: [], content: "This rock paper scissors game has ended due to inactivity." });
        delete rpsChannels[this.message.channel.id];
    }, 60_000))();

    constructor(public firstPlayer: User, public firstMove: string, public message: Message<boolean>) { }
}

// Credits to Memw
export default {
	async run(interaction: TInteraction) {
        const move = interaction.options.getString("move", true);

        if (!rpsChannels.hasOwnProperty(interaction.channelId)) {
            await interaction.deferReply({ ephemeral: true }).then(() => interaction.deleteReply());

            const message = await interaction.channel?.send({ embeds: [new EmbedBuilder()
                .setTitle("Rps game started")
                .setDescription(`To play with <@${interaction.user.id}> run the command again.`)
                .setFooter({ text: "You have 60 seconds to reply with another interaction." })
            ] });

            rpsChannels[interaction.channelId] = new RpsInstance(interaction.user, move, message as NonNullable<typeof message>);
        } else if (rpsChannels.hasOwnProperty(interaction.channelId)) {
            let firstMove = rpsChannels[interaction.channelId];
            
            if (interaction.user.id !== firstMove.firstPlayer.id) {
                await interaction.deferReply();
                let winner = null;

                if (move === 'rock') if (firstMove.firstMove === 'paper') winner = firstMove.firstPlayer; else winner = interaction.user;
                if (move === 'scissors') if (firstMove.firstMove === 'rock') winner = firstMove.firstPlayer; else winner = interaction.user;
                if (move === 'paper') if (firstMove.firstMove === 'scissors') winner = firstMove.firstPlayer; else winner = interaction.user;
                if (move === firstMove.firstMove) winner = null;

                await firstMove.message.edit({ embeds: [new EmbedBuilder()
                    .setTitle("Rps game ended")
                    .setDescription(`Both players sent their move.\n**${firstMove.firstPlayer.tag}:** ${firstMove.firstMove}\n**${interaction.user.tag}:** ${move}`)
                    .setFooter({ text: `This game has ended, ${winner ? `${winner.tag} won.` : `it's a tie.`}` })
                ] });

                delete rpsChannels[interaction.channelId];
                await interaction.deleteReply();
            } else await interaction.reply("You can't play with yourself.");
        } else await interaction.reply({ content: "You can't start 2 different games in the same channel, go to another channel or wait for the current game to end.", ephemeral: true });
    },
    data: new SlashCommandBuilder()
        .setName("rps")
        .setDescription("Start a rock paper scissors game.")
        .addStringOption(x => x
			.setName("move")
			.setDescription("Your move")
			.addChoices(
				{ name: "Rock", value: "rock" },
				{ name: "Paper", value: "paper" },
				{ name: "Scissors", value: "scissors" })
			.setRequired(true))
}
