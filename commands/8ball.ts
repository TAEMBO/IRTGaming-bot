import Discord, { SlashCommandBuilder } from "discord.js";
import YClient from '../client.js';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const question = interaction.options.getString("question", true);

        if (question.length < 5) return interaction.reply('Ask a real question, numb nut.');

        const embed = new client.embed().setColor(client.config.embedColor)
        const answers = ['Without a doubt. Nah, I\'m just messing with you', 'My sources say no', 'Yes, definitely. Unless...', 'As if', 'Dumb question, Ask another', 'Forget about it', 'In your dreams', 'Not a chance', 'Obviously', 'Oh please', 'Sure', 'That\'s ridiculous', 'Well maybe', 'What do you think?', 'Who cares?', 'Yeah right', 'You wish', 'You\'ve got to be kidding...', 'Yes', 'It is certain', 'It is decidedly so', 'Without a doubt', 'Yes definitely', 'You may rely on it', 'As I see it, yes', 'Most likely', 'Outlook good', 'Signs point to yes', 'Reply hazy try again', 'Ask again later', 'Better not tell you now', 'Cannot predict now', 'Concentrate and ask again', 'Don\'t count on it', 'My reply is no', 'Outlook not so good', 'Very doubtful', 'My dad said I cant answer that, try again later', '*yawn*'];
        const Randomanswer = Math.floor(Math.random() * answers.length);

        if (question === "possibleanswers") {
            embed.setTitle('8ball possible answers:').setDescription(answers.map(x => `\`${x}\``).join('\n'));
        } else embed.setTitle("8Ball").setDescription(`> ${question}\n\n**${answers[Randomanswer]}**`);
        
        interaction.reply({embeds: [embed]});

},
    data: new SlashCommandBuilder()
        .setName("8ball")
        .setDescription("You ask a question and it will answer you from a premade array.")
        .addStringOption((opt)=>opt
            .setName("question")
            .setDescription("Your question to the bot.")
            .setRequired(true)
        )
}