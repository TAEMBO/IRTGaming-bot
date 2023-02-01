import Discord, { SlashCommandBuilder } from "discord.js";
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const answers = ['Without a doubt. Nah, I\'m just messing with you', 'My sources say no', 'Yes, definitely. Unless...', 'As if', 'Dumb question, Ask another', 'Forget about it', 'In your dreams', 'Not a chance', 'Obviously', 'Oh please', 'Sure', 'That\'s ridiculous', 'Well maybe', 'What do you think?', 'Who cares?', 'Yeah right', 'You wish', 'You\'ve got to be kidding...', 'Yes', 'It is certain', 'It is decidedly so', 'Without a doubt', 'Yes definitely', 'You may rely on it', 'As I see it, yes', 'Most likely', 'Outlook good', 'Signs point to yes', 'Reply hazy try again', 'Ask again later', 'Better not tell you now', 'Cannot predict now', 'Concentrate and ask again', 'Don\'t count on it', 'My reply is no', 'Outlook not so good', 'Very doubtful', 'My dad said I cant answer that, try again later', '*yawn*'];
        const msg = interaction.options.getString("question") as string;
        const Randomanswer = Math.floor(Math.random() * answers.length);

        if(msg.length <= 4){
            interaction.reply('Ask a real question, numb nut.');
            return;
        }

        const eightballembed = new client.embed()
            .setTitle("8Ball")
            .setColor(client.config.embedColor)

        if(msg === "possibleanswers"){
            let possibleanswers = "";
            answers.forEach(function (item){
                possibleanswers = possibleanswers + "`" + item + "`\n";
                return possibleanswers;
            })
            eightballembed.setTitle("8ball possible answers:")
            eightballembed.setDescription(possibleanswers)
        }else{
            eightballembed.setDescription(`> ${msg}\n\n**${answers[Randomanswer]}**`)
        }

            interaction.reply({embeds: [eightballembed]});

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