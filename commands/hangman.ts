import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		const channel = interaction.channel as Discord.TextChannel;
		if (client.games.has(channel.id)) {
			return interaction.reply(`There is already an ongoing game in this channel created by ${client.games.get(channel.id)}`);
		}
		client.games.set(channel.id, interaction.user.tag);
		await interaction.reply({content: `Game started!`, ephemeral: true});
		let hiddenLetters = true;
		let fouls = 0;
		let latestActivity = Date.now();
		const word = interaction.options.getString("word") as string;
		const ea = await interaction.followUp({content: `A hangman game has been started by *${interaction.user.tag}*!\nAnyone can guess letters or the full word by doing \`guess [letter or word]\`\nThe word is:\n\`\`\`\n${hideWord()}\n\`\`\``, fetchReply: true});
		const guessedWordsIndices: Array<number>= [];
		const guesses: Array<string> = [];
		function wordUpdate() {
			const hideWordResult = hideWord();
			let winText = '';
			if (!hiddenLetters) {
				winText = `\nThe whole word has been revealed. The hangman game ends. The word was:\n\`\`\`\n${word}\n\`\`\``;
				client.games.delete(channel.id);
				guessCollector.stop();
				clearInterval(interval);

			}
			ea.reply(`A part of the word has been revealed. This what the word looks like now:\n\`\`\`\n${hideWordResult}\n\`\`\`` + winText);
		}
		function hideWord() {
			hiddenLetters = false;
			return word.split('').map((x, i) => {
				if (guesses.includes(x) || guessedWordsIndices.includes(i)) return x;
				else if (x === ' ') return ' ';
				else {
					hiddenLetters = true;
					return '_';
				}
			}).join(' ');
		}
		function guessLetter(letter: string) {
			latestActivity = Date.now();
			if (guesses.includes(letter)) return channel.send('That letter has been guessed already.');
			guesses.push(letter);
			if (!word.includes(letter)) {
				fouls++;
				checkFouls();
				return;
			}
			wordUpdate();
		}
		function guessWord(text: string) {
			latestActivity = Date.now();
			if (!word.includes(text)) {
				fouls++;
				checkFouls(true);
				return;
			}
			const guessedTextStartIndex = word.indexOf(text);
			const guessedTextCharIndices = Array.from(Array(text.length).keys());
			guessedWordsIndices.push(...guessedTextCharIndices.map(x => x + guessedTextStartIndex));
			wordUpdate();
		}
		const guessCollector = (interaction.channel as Discord.TextChannel).createMessageCollector({max: 1});

		guessCollector.on('collect', (guessMessage: Discord.Message) => {
			if (guessMessage.author.bot) return;
			if (guessMessage.content.toLowerCase().startsWith('guess')) {
				const guess = guessMessage.content.slice(6).toLowerCase();
				if (!guess || guess.length === 0) {
					guessMessage.reply({content: 'You\'re using the \`guess\` command wrong. Get good.', allowedMentions: { repliedUser: false }})
					return;
				}
				if (guess.length > 1) {
					guessWord(guess);
				} else {
					guessLetter(guess);
				}
			}
		});

		const interval = setInterval(() => {
			const channel = interaction.channel as Discord.TextChannel;
			if (Date.now() > latestActivity + 5 * 60 * 1000 && client.games.has(channel.id)) {
				channel.send('The hangman game has ended due to inactivity.');
				client.games.delete(channel.id);
				guessCollector.stop();
				clearInterval(interval);
			}
		}, 5000);

		function checkFouls(textGuess?: any) {
			const stages = [
				[
					'      ',
					'      ',
					'      ',
					'      ',
					'╭────╮',
					'╯    ╰'
				],
				[
					'      ',
					'      ',
					'  ┃   ',
					'  ┃   ',
					'╭─┸──╮',
					'╯    ╰'
				],
				[
					'  ┏   ',
					'  ┃   ',
					'  ┃   ',
					'  ┃   ',
					'╭─┸──╮',
					'╯    ╰'
				],
				[
					'  ┏   ',
					'  ┃   ',
					'  ┃   ',
					' ┌┨   ',
					'╭┴┸──╮',
					'╯    ╰'
				],
				[
					'  ┏━┓ ',
					'  ┃   ',
					'  ┃   ',
					' ┌┨   ',
					'╭┴┸──╮',
					'╯    ╰'
				],
				[
					'  ┏━┓ ',
					'  ┃ ⎔ ',
					'  ┃   ',
					' ┌┨   ',
					'╭┴┸──╮',
					'╯    ╰'
				],
				[
					'  ┏━┓ ',
					'  ┃ ⎔ ',
					'  ┃╶╂╴',
					' ┌┨ ^ ',
					'╭┴┸──╮',
					'╯    ╰'
				],
			];
			let loseText = '';
			if (fouls === 7) {
				loseText = `\nThe poor fella got hung. You lost the game. The word was:\n\`\`\`\n${word}\n\`\`\``;
				client.games.delete((interaction.channel as Discord.TextChannel).id);
				guessCollector.stop();
				clearInterval(interval);
			}
			ea.reply(`The word doesn\'t include that ${!textGuess ? 'letter' : 'piece of text'}.\nAn incorrect guess leads to the addition of things to the drawing. It now looks like this:\n\`\`\`\n${stages[fouls - 1].join('\n')}\n\`\`\`` + loseText);
		}
	},
	data: new SlashCommandBuilder()
		.setName("hangman")
		.setDescription("Starts a game of hangman!")
		.addStringOption((opt)=>opt
			.setName("word")
			.setDescription("The word to users have to try and guess.")
			.setRequired(true))
};