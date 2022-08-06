const { SlashCommandBuilder } = require("@discordjs/builders");

rpsChannels = {};

class RpsInstance{
    firstPlayer = null;
    firstMove = null;
    message = null;
    constructor(client, firstPlayer, firstMove, message) {
        this.firstPlayer = firstPlayer;
        this.firstMove = firstMove;
        this.message = message;
        this.timeOut(client, message);
    }

    async timeOut(client, message){
        setTimeout(async () => {
            if(rpsChannels.hasOwnProperty(message.channel.id)){
                await this.message.edit({embeds: [], content: "This game was cancelled due to timeout."});
                delete rpsChannels[message.channel.id];
                client.games.delete(message.channel.id);
            }
        }, 60000);
    }
}

// Credits to Memw#6969
module.exports = {
    run: async (client, interaction) => {
        const move = interaction.options.getString('move');
        if (!client.games.has(interaction.channel.id)) {
            client.games.set(interaction.channel.id, interaction.user.tag);
            await interaction.deferReply();
            const embed = new client.embed()
                .setTitle("RPS game started")
                .setDescription(`To play with <@${interaction.user.id}>,  run \`/rps\` with your choice`)
                .setFooter({text: "You have 60 seconds to reply with an interaction."})
				.setColor(client.config.embedColor);
            await interaction.deleteReply();
            const message = await interaction.channel.send({embeds: [embed]});
            rpsChannels[interaction.channel.id] = new RpsInstance(client, interaction.user, move, message);
        } else {
            let firstMove = rpsChannels[interaction.channel.id];
            if (interaction.user.id === firstMove.firstPlayer.id) {
                await interaction.reply({content: "You can't play with yourself."});
            } else {
                await interaction.deferReply();
                let winner = null;
                if (move === 'rock') if (firstMove.firstMove === 'paper') winner = firstMove.firstPlayer; else winner = interaction.user;
                if (move === 'scissors') if (firstMove.firstMove === 'rock') winner = firstMove.firstPlayer; else winner = interaction.user;
                if (move === 'paper') if (firstMove.firstMove === 'scissors') winner = firstMove.firstPlayer; else winner = interaction.user;
				if (move === firstMove.firstMove) winner = null;
                const embed = new client.embed()
                    .setTitle("Rps game ended")
                    .setDescription(`Both players sent their move.\n**${firstMove.firstPlayer.tag}:** ${firstMove.firstMove}\n**${interaction.user.tag}:** ${move}`)
                    .setFooter({text: `This game has ended, ${winner ? `${winner.tag} won.` : `it's a tie.`}`})
					.setColor(client.config.embedColor);
                await firstMove.message.edit({embeds: [embed]});
                delete rpsChannels[interaction.channel.id];
                client.games.delete(interaction.channel.id);
                await interaction.deleteReply();
            }
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