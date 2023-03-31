import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		const channel = interaction.channel as Discord.TextChannel;
		if (client.games.has(channel.id)) return interaction.reply(`There is already an ongoing game in this channel created by ${client.games.get(channel.id)}`);

		client.games.set(channel.id, interaction.user.tag);
		await interaction.reply({content: `Game started!`, ephemeral: true});

		let hiddenLetters = true;
		let fouls = 0;
		let latestActivity = Date.now();
		const guesses: Array<string> = [];
		const guessedWordsIndices: Array<number>= [];
		const phrase = interaction.options.getString("phrase", true).toLowerCase();
		const wordOrPhrase = phrase.includes(' ') ? 'phrase' : 'word';
		const botMsg = await interaction.followUp({content: `A hangman game has been started by *${interaction.user.tag}*!\nAnyone can guess letters${phrase.includes(' ') ? ', a word, or the full phrase': ' or the full word'} by doing \`guess [letter${phrase.includes(' ') ? ', word, or phrase' : ' or word'}]\`\nThe ${wordOrPhrase} is:\n\`\`\`\n${hidePhrase()}\n\`\`\``, fetchReply: true});
		function phraseUpdate() {
			const hideWordResult = hidePhrase();
			let text = `A part of the ${wordOrPhrase} has been revealed, this is what it looks like now:\n\`\`\`\n${hideWordResult}\n\`\`\``;
			if (!hiddenLetters) {
				text = `The whole ${wordOrPhrase} has been revealed! The hangman game ends with the ${wordOrPhrase} being:\n\`\`\`\n${phrase}\n\`\`\``;
				client.games.delete(channel.id);
				guessCollector.stop();
				clearInterval(interval);
			}
			botMsg.reply({content: text, allowedMentions: {repliedUser: false}});
		}
		function hidePhrase() {
			hiddenLetters = false;
			return phrase.split('').map((x, i) => {
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
			if (!phrase.includes(letter)) {
				fouls++;
				checkFouls(false);
				return;
			}
			phraseUpdate();
		}
		function guessWord(text: string) {
			latestActivity = Date.now();
			if (!phrase.includes(text)) {
				fouls++;
				checkFouls(true);
				return;
			}
			const guessedTextStartIndex = phrase.indexOf(text);
			const guessedTextCharIndices = Array.from(Array(text.length).keys());
			guessedWordsIndices.push(...guessedTextCharIndices.map(x => x + guessedTextStartIndex));
			phraseUpdate();
		}
		const guessCollector = (interaction.channel as Discord.TextChannel).createMessageCollector();

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
			if (Date.now() > latestActivity + 60000 && client.games.has(channel.id)) {
				botMsg.reply({content: 'The hangman game has ended due to inactivity.', allowedMentions: {repliedUser: false}});
				client.games.delete(channel.id);
				guessCollector.stop();
				clearInterval(interval);
			}
		}, 5000);

		function checkFouls(isWord: boolean) {
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
				loseText = `\nThe poor fella got hung. You lost the game. The ${wordOrPhrase} was:\n\`\`\`\n${phrase}\n\`\`\``;
				client.games.delete((interaction.channel as Discord.TextChannel).id);
				guessCollector.stop();
				clearInterval(interval);
			}
			botMsg.reply({content: `The ${wordOrPhrase} doesn\'t include that ${isWord ? 'piece of text' : 'letter'}.\nAn incorrect guess leads to the addition of things to the drawing. It now looks like this:\n\`\`\`\n${stages[fouls - 1].join('\n')}\n\`\`\`` + loseText, allowedMentions: {repliedUser: false}});
		}
	},
	data: new SlashCommandBuilder()
		.setName("hangman")
		.setDescription("Starts a game of hangman!")
		.addStringOption((opt)=>opt
			.setName("phrase")
			.setDescription("The word or phrase for members to guess")
			.setRequired(true))
};