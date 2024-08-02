import { SlashCommandBuilder } from "discord.js";
import { Command } from "#structures";

export default new Command<"chatInput">({
    async run(interaction) {
        await interaction.reply({ content: "Game started!", ephemeral: true });

        let hiddenLetters = true;
        let fouls = 0;
        let latestActivity = Date.now();
        const guesses: string[] = [];
        const guessedWordsIndices: number[] = [];
        const phrase = interaction.options.getString("phrase", true).toLowerCase();
        const wordOrPhrase = phrase.includes(" ") ? "phrase" : "word";
        const botMsg = await interaction.followUp({
            content: `A hangman game has been started by *${interaction.user.tag}*!\nAnyone can guess letters${phrase.includes(" ") ? ", a word, or the full phrase": " or the full word"} by doing \`guess [letter${phrase.includes(" ") ? ", word, or phrase" : " or word"}]\`\nThe ${wordOrPhrase} is:\n\`\`\`\n${hidePhrase()}\n\`\`\``,
            fetchReply: true
        });
        const guessCollector = interaction.channel!.createMessageCollector({ filter: msg => !msg.author.bot && msg.content.toLowerCase().startsWith("guess") });

        await interaction.deleteReply();

        async function phraseUpdate() {
            const hideWordResult = hidePhrase();
            let text = `A part of the ${wordOrPhrase} has been revealed, this is what it looks like now:\n\`\`\`\n${hideWordResult}\n\`\`\``;

            if (!hiddenLetters) {
                text = `The whole ${wordOrPhrase} has been revealed! The hangman game ends with the ${wordOrPhrase} being:\n\`\`\`\n${phrase}\n\`\`\``;
                guessCollector.stop();
                clearInterval(interval);
            }

            await botMsg.reply(text);
        }

        function hidePhrase() {
            hiddenLetters = false;

            return phrase.split("").map((x, i) => {
                if (guesses.includes(x) || guessedWordsIndices.includes(i)) return x;
                else if (x === " ") return " ";
                else {
                    hiddenLetters = true;
                    return "_";
                }
            }).join(" ");
        }

        async function guessLetter(letter: string) {
            latestActivity = Date.now();

            if (guesses.includes(letter)) return await interaction.channel!.send("That letter has been guessed already.");

            guesses.push(letter);

            if (!phrase.includes(letter)) {
                fouls++;
                await checkFouls(false);
                return;
            }
        }

        async function guessWord(text: string) {
            latestActivity = Date.now();

            if (!phrase.includes(text)) {
                fouls++;
                await checkFouls(true);
                return;
            }

            const guessedTextStartIndex = phrase.indexOf(text);
            const guessedTextCharIndices = Array.from(Array(text.length).keys());
            guessedWordsIndices.push(...guessedTextCharIndices.map(x => x + guessedTextStartIndex));
        }

        async function checkFouls(isWord: boolean) {
            let loseText = "";
            const stages = [
                [
                    "      ",
                    "      ",
                    "      ",
                    "      ",
                    "╭────╮",
                    "╯    ╰"
                ],
                [
                    "      ",
                    "      ",
                    "  ┃   ",
                    "  ┃   ",
                    "╭─┸──╮",
                    "╯    ╰"
                ],
                [
                    "  ┏   ",
                    "  ┃   ",
                    "  ┃   ",
                    "  ┃   ",
                    "╭─┸──╮",
                    "╯    ╰"
                ],
                [
                    "  ┏   ",
                    "  ┃   ",
                    "  ┃   ",
                    " ┌┨   ",
                    "╭┴┸──╮",
                    "╯    ╰"
                ],
                [
                    "  ┏━┓ ",
                    "  ┃   ",
                    "  ┃   ",
                    " ┌┨   ",
                    "╭┴┸──╮",
                    "╯    ╰"
                ],
                [
                    "  ┏━┓ ",
                    "  ┃ ⎔ ",
                    "  ┃   ",
                    " ┌┨   ",
                    "╭┴┸──╮",
                    "╯    ╰"
                ],
                [
                    "  ┏━┓ ",
                    "  ┃ ⎔ ",
                    "  ┃╶╂╴",
                    " ┌┨ ^ ",
                    "╭┴┸──╮",
                    "╯    ╰"
                ],
            ];

            if (fouls === 7) {
                loseText = `\nThe poor fella got hung. You lost the game. The ${wordOrPhrase} was:\n\`\`\`\n${phrase}\n\`\`\``;
                guessCollector.stop();
                clearInterval(interval);
            }

            await botMsg.reply(`The ${wordOrPhrase} doesn't include that ${isWord ? "piece of text" : "letter"}.\nAn incorrect guess leads to the addition of things to the drawing. It now looks like this:\n\`\`\`\n${stages[fouls - 1].join("\n")}\n\`\`\`` + loseText);
        }

        guessCollector.on("collect", async guessMessage => {
            const guess = guessMessage.content.slice(6).toLowerCase();

            if (!guess || !guess.length) return void await guessMessage.reply("You're using the `guess` command wrong. Get good.");

            if (guess.length > 1) {
                await guessWord(guess);
            } else await guessLetter(guess);

            await phraseUpdate();
        });

        const interval = setInterval(async () => {
            if (Date.now() <= (latestActivity + 120_000)) return;
            
            await botMsg.reply("The hangman game has ended due to inactivity.");
            guessCollector.stop();
            clearInterval(interval);
        }, 5_000);
    },
    data: new SlashCommandBuilder()
        .setName("hangman")
        .setDescription("Start a game of hangman")
        .addStringOption(x => x
            .setName("phrase")
            .setDescription("The word or phrase for others to guess")
            .setRequired(true))
});