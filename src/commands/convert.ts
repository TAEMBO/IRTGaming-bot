import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { TInteraction } from '../typings.js';

interface Quantity {
	name: string;
	short: string[];
	value: number;
	numeratorQuantity?: string;
	denominatorQuantity?: string;
	tempMath?: {
		toSelf: string;
		toBase: string;
	};
}

const quantities: Record<string, Quantity[]> = {
    storage: [
        { name: 'bit', value: 1, short: ['bit', 'bits'] },
        { name: 'kilobit', value: 1_000, short: ['Kbit', 'kilobits'] },
        { name: 'megabit', value: 1_000_000, short: ['Mbit', 'megabits'] },
        { name: 'gigabit', value: 1_000_000_000, short: ['Gbit', 'gigabits'] },
        { name: 'terabit', value: 1_000_000_000_000, short: ['Tbit', 'terabits'] },
        { name: 'byte', value: 8, short: ['byte', 'bytes'] },
        { name: 'kilobyte', value: 8_000, short: ['KB', 'kilobytes'] },
        { name: 'megabyte', value: 8_000_000, short: ['MB', 'megabytes'] },
        { name: 'gigabyte', value: 8_000_000_000, short: ['GB', 'gigabytes'] },
        { name: 'terabyte', value: 8_000_000_000_000, short: ['TB', 'terabytes'] },

    ],
	space: [
		{ name: 'metre', value: 1, short: ['m', 'meter'] },
		{ name: 'centimetre', value: 0.01, short: ['cm', 'centimeter'] },
		{ name: 'millimetre', value: 0.001, short: ['mm', 'millimeter']},
		{ name: 'kilometre', value: 1_000, short: ['km', 'kilometer'] },
		{ name: 'mile', value: 1_609.344, short: ['mi', 'miles'] },
		{ name: 'yard', value: .9144, short: ['yd', 'yards'] },
		{ name: 'foot', value: 0.3048, short: ['ft', 'feet', '\''] },
		{ name: 'inch', value: 0.0254, short: ['in', 'inches', '\"'] },
		{ name: 'light-year', value: 9_460_528_400_000_000, short: ['ly', 'lightyear'] },
		{ name: 'astronomical unit', value: 149_597_870_700, short: ['au'] }
	],
	currency: [
		{ name: 'Euro :flag_eu:', value: 1, short: ['EUR', '€'] },
		{ name: 'US Dollar :flag_us:', value: 0.95, short: ['USD', '$'], },
		{ name: 'Pound Sterling :flag_gb:', value: 1.15, short: ['GBP', '£'] },
		{ name: 'Turkish Lira :flag_tr:', value: 0.035, short: ['TRY', 'TL', '₺'] },
		{ name: 'Russian Ruble :flag_ru:', value: 0.0098, short: ['RUB', '₽'] },
		{ name: 'Canadian Dollar :flag_ca:', value: 0.70, short: ['CAD'] },
		{ name: 'Australian Dollar :flag_au:', value: 0.61, short: ['AUD'] },
		{ name: 'Japanese Yen :flag_jp:', value: 0.0064, short: ['JPY', '¥', 'yen', 'jy'] },
		{ name: 'New Zealand Dollar :flag_nz:', value: 0.56, short: ['NZD'] },
		{ name: 'Indonesian Rupiah :flag_id:', value: 0.000061, short: ['IDR', 'Rp'] },
		{ name: 'Chinese Yuan Renminbi :flag_cn:', value: 0.13, short: ['CN¥', 'CNY', 'RMB', '元'] },
		{ name: 'Swedish krona :flag_se:', value: 0.086, short: ['SEK', 'kr'] },
		{ name: 'Norwegian krone :flag_no:', value: 0.087, short: ['NOK'] },
		{ name: 'Danish krone :flag_dk:', value: 0.13, short: ['DKK'] },
		{ name: 'Icelandic króna :flag_is:', value: 0.0069, short: ['ISK'] },
		{ name: 'Czech koruna :flag_cz:', value: 0.041, short: ['CZK', 'Kč'] },
		{ name: 'Swiss franc :flag_sw:', value: 1.03, short: ['CFH', 'fr'] },
		{ name: 'Ukrainian hryvnia :flag_ua:', value: 0.026, short: ['UAH', '₴', 'грн'] },
		{ name: 'Indian rupee :flag_in:', value: 0.011, short: ['INR', '₹'] },
		{ name: 'United Arab Emirates dirham :flag_ae:', value: 0.26, short: ['AED', 'د.إ'] },
		{ name: 'Sri Lankan Rupee :flag_lk:', value: 0.0029, short: ['LKR', 'රු', 'ரூ'] },
		{ name: 'Hungarian Forint :flag_hu:', value: 0.0026, short: ['HUF'] },
		{ name: 'Among Us ඞ:red_square:', value: NaN, short: ['SUS'] },
	],
	mass: [
		{ name: 'gram', value: 1, short: ['g'] },
		{ name: 'kilogram', value: 1000, short: ['kg', 'kgs'] },
		{ name: 'pound', value: 453.59237, short: ['lbs', 'b'] },
		{ name: 'ounce', value: 28.3495231, short: ['oz'] }
	],
	volume: [
		{ name: 'metre cubed', value: 1, short: ['m^3', 'm3', 'meter cubed'] },
		{ name: 'centimetre cubed', value: 0.000001, short: ['cm^3', 'cm3', 'centimeter cubed'] },
		{ name: 'US fluid ounce', value: 0.0000295735296, short: ['fl oz', 'floz'] },
		{ name: 'litre', value: 0.001, short: ['l', 'liter'] },
		{ name: 'desilitre', value: 0.0001, short: ['dl', 'desiliter'] },
		{ name: 'millilitre', value: 0.000001, short: ['ml', 'milliliter'] },
		{ name: 'US gallon', value: 0.00378541, short: ['gal'] }
	],
	temperature: [
		{ name: 'kelvin', short: ['K'], tempMath: { toSelf: 'absolute', toBase: 'starter?.amount' }, value: 0 },
		{ name: 'celsius', short: ['°C', 'c'], tempMath: { toSelf: 'absolute - 273.15', toBase: 'starter?.amount + 273.15' }, value: 0 },
		{ name: 'fahrenheit', short: ['°F', 'fh', 'f'], tempMath: { toSelf: '((9 / 5) * (absolute - 273.15)) + 32', toBase: '((5 / 9) * (starter?.amount - 32)) + 273.15' }, value: 0 }
	],
	time: [
		{ name: 'millisecond', value: 0.001, short: ['ms'] },
		{ name: 'second', value: 1, short: ['sec', 'seconds'] },
		{ name: 'minute', value: 60, short: ['min', 'minutes'] },
		{ name: 'hour', value: 3_600, short: ['hr', 'hours'] },
		{ name: 'day', value: 86_400, short: ['d', 'days'] },
		{ name: 'week', value: 604_800, short: ['w', 'weeks'] },
		{ name: 'month', value: 2_592_000, short: ['mo', 'months'] },
		{ name: 'year', value: 31_556_952, short: ['y', 'yr', 'years'] },
	],
	force: [
		{ name: 'newton', value: 1, short: ['N'] },
		{ name: 'kilonewton', value: 1000, short: ['kN'] },
		{ name: 'dyne', value: 100000, short: ['dyn'] },
		{ name: 'pound-force', value: 4.448222, short: ['lbf'] },
		{ name: 'poundal', value: 0.1382550, short: ['pdl'] },
		{ name: 'kip', value: 4448.22, short: ['kip'] },
		{ name: 'kilogram-force', value: 9.806650, short: ['kgf'] },
	],
	energy: [
		{ name: 'joule', value: 1, short: ['J'] },
		{ name: 'kilowatt-hour', value: 3600000, short: ['kWh'] },
		{ name: 'calorie', value: 4.184, short: ['cal'] },
		{ name: 'electronvolt', value: 0.0000000000000000001602176634, short: ['eV'] },
		{ name: 'foot-pound force', value: 1.355818, short: ['ft⋅lbf', 'ftlbf', 'ftlb']},
	]
};

function findUnit(unitNameQuery: string) {
	// short search
	for (let i = 0; i < Object.values(quantities).length; i++) {
		const unit = Object.values(quantities)[i].find(x => x.short.some(y => y.toLowerCase() === unitNameQuery.toLowerCase()));
		if (unit) {
			const quantity = Object.keys(quantities)[i];
			return { quantity, unit };
		}
	}

	// name identical search
	for (let i = 0; i < Object.values(quantities).length; i++) {
		const unit = Object.values(quantities)[i].find(x => x.name.toLowerCase() === unitNameQuery.toLowerCase());
		if (unit) {
			const quantity = Object.keys(quantities)[i];
			return { quantity, unit };
		}
	}

	// name inclusive search
	for (let i = 0; i < Object.values(quantities).length; i++) {
		const unit = Object.values(quantities)[i].find(x => x.name.toLowerCase().includes(unitNameQuery.toLowerCase()));
		if (unit) {
			const quantity = Object.keys(quantities)[i];
			return { quantity, unit };
		}
	}
}
export default {
	async run(interaction: TInteraction) {
		if (interaction.options.getSubcommand() === 'help') {
			const wantedQuantity = Object.keys(quantities).find(x => x === interaction.options.getString("type"));

			if (wantedQuantity) {
				const units = quantities[wantedQuantity];

				await interaction.reply({ embeds: [new EmbedBuilder()
					.setTitle(`Convert help: ${wantedQuantity}`)
					.setDescription(`This quantity comprises ${units.length} units, which are:\n\n${units.sort((a, b) => a.name.localeCompare(b.name)).map(unit => `**${unit.name[0].toUpperCase() + unit.name.slice(1)}** (${unit.short.map(x => `\`${x}\``).join(', ')})`).join('\n')}`)
					.setColor(interaction.client.config.embedColor)
				] });
			} else await interaction.reply({ embeds: [new EmbedBuilder()
				.setTitle('Convert help')
				.setColor(interaction.client.config.embedColor)	
				.setDescription(`To convert something, you add **amount** and **unit** combinations to the end of the command. The syntax for an amount and unit combination is \`[amount][unit symbol]\`. Amount and unit combinations are called **arguments**. Arguments are divided into **starters** and a **target unit**. Starters are the starting values that you want to convert to the target unit. A conversion command consists of one or many starters, separated with a comma (\`,\`) in case there are many. After starters comes the target unit, which must have a greater-than sign (\`>\`) or the word "to" before it. The argument(s) after the \`>\` (or "to"), called the target unit, must not include an amount. It is just a **unit symbol**. Because you cannot convert fruits into lengths, all starters and the target unit must be of the same **quantity**.`)
				.addFields(
					{ name: 'Supported Quantities', value: Object.keys(quantities).map(x => x[0].toUpperCase() + x.slice(1)).join(', ') + `\n\nTo learn more about a quantity and its units and unit symbols,\ndo \`/convert help [quantity]\``},
					{ name: 'Examples', value: `An amount: "5", "1200300", "1.99"\nA unit: metre, kelvin, Euro\nA unit symbol: "fh", "cm^3", "$", "fl oz"\nAn argument: "180cm", "12.99€", "5km", "16fl oz"\nA target unit: ">km", ">c", ">m2"\nA complete conversion command: "\`/convert 5ft, 8in to cm\`", "\`/convert 300kelvin >celsius\`", "\`/convert 57mm, 3.3cm, 0.4m >cm\`", "\`/convert 2dl, 0.2l to fl oz\`"`},
					{ name: 'Fracton conversion', value: 'Use division in your commands to achieve something, for example velocity conversion. In fraction conversion, all the starters\' and the target\'s unit symbol must be a fraction. The syntax for a fraction is \`[unit symbol]["/" or "per"][unit symbol]\`. All of the numerators must be of the same quantity. Same for the denominators. You cannot mix fractions and non-fractions. Examples of Fraction Conversion:\n\`/convert 5m/s >km/h\`\n\`/convert 5 miles per hour, 1 meter per second to kilometers per hour\`'})
			] });
		} else {
			const starters: any[] = [];

			for await (let starter of interaction.options.getString('starter', true).split(',')) {
				starter = starter.trim();
				const stMtch = starter.match(/[0-9\,\.\-]*/gi) as RegExpMatchArray;

				// fraction
				if (starter.includes('/') || starter.includes(' per ')) {
					if (!starter.match(/[0-9\,\.\-]*/gi)) break;
					const separator = starter.includes('/') ? '/' : 'per';
					const multiplier = stMtch[0];
					const numeratorUnitSymbol = starter.slice(multiplier.length, starter.indexOf(separator)).trim();
					const numeratorUnit = findUnit(numeratorUnitSymbol.endsWith('s') && numeratorUnitSymbol.length !== 1 ? numeratorUnitSymbol.slice(0, numeratorUnitSymbol.length - 1) : numeratorUnitSymbol);
					const denominatorUnitSymbol = starter.slice(starter.indexOf(separator) + separator.length).trim();
					const denominatorUnit = findUnit(denominatorUnitSymbol);
					if (!numeratorUnit) {
						await interaction.reply(numeratorUnitSymbol + ' is wrong.');
						break;
					}
					if (!denominatorUnit) {
						await interaction.reply(denominatorUnitSymbol + ' is wrong.');
						break;
					}
					starters.push({
						amount: parseFloat(multiplier),
						quantity: 'mixed',
						unit: {
							numeratorQuantity: numeratorUnit.quantity,
							denominatorQuantity: denominatorUnit.quantity,
							name: numeratorUnit.unit.name + '(s) per ' + denominatorUnit.unit.name,
							value: (numeratorUnit.unit.value ?? 0) / (denominatorUnit.unit.value ?? 0),
							short: [numeratorUnit.unit.short[0] + '/' + denominatorUnit.unit.short[0]],
							tempMath: (numeratorUnit.unit.tempMath ?? denominatorUnit.unit.tempMath)
						}
					});
				} else {
					const unitSymbol = starter.slice(stMtch[0].length).trim();
					starters.push(Object.assign({ amount: parseFloat(starter) }, findUnit(unitSymbol.endsWith('s') && unitSymbol.length > 3 ? unitSymbol.slice(0, unitSymbol.length - 1) : unitSymbol)));
				}
			}

			if (interaction.replied) return;
			if (!starters[0]) return await interaction.reply('You must convert _something._ Your message has 0 starters.');

			const target = await (async () => {
				const targetPortion = interaction.options.getString('target', true);

				// target: fraction
				if (targetPortion.includes('/') || targetPortion.includes(' per ')) {
					const separator = targetPortion.includes('/') ? '/' : 'per';
					const numeratorUnitSymbol = targetPortion.slice(0, targetPortion.indexOf(separator)).trim();
					const numeratorUnit = findUnit(numeratorUnitSymbol.endsWith('s') && numeratorUnitSymbol.length !== 1 ? numeratorUnitSymbol.slice(0, numeratorUnitSymbol.length - 1) : numeratorUnitSymbol);
					const denominatorUnitSymbol = targetPortion.slice(targetPortion.indexOf(separator) + separator.length).trim();
					const denominatorUnit = findUnit(denominatorUnitSymbol);
					if (!numeratorUnit) {
						await interaction.reply(numeratorUnitSymbol + ' is wrong.');
						return;
					}
					if (!denominatorUnit) {
						await interaction.reply(denominatorUnitSymbol + ' is wrong.');
						return;
					}
					const division = (numeratorUnit.unit.value ?? 0) / (denominatorUnit.unit.value ?? 0);
					return {
						quantity: 'mixed',
						unit: {
							numeratorQuantity: numeratorUnit.quantity,
							denominatorQuantity: denominatorUnit.quantity,
							name: numeratorUnit.unit.name + '(s) per ' + denominatorUnit.unit.name,
							value: division,
							short: [numeratorUnit.unit.short[0] + '/' + denominatorUnit.unit.short[0]],
							tempMath: (numeratorUnit.unit.tempMath ?? denominatorUnit.unit.tempMath)
						}
					};
				} else return findUnit(targetPortion.endsWith('s') && targetPortion.length > 3 ? targetPortion.slice(0, targetPortion.length - 1) : targetPortion);
			})();

			if (interaction.replied) return;
			if (!target) return await interaction.reply('You must convert _to_ something. Your message doesn\'t have a (valid) target unit.').catch();

			// check that all starters and target are the same quantity
			const usedQuantities = new Set([target.quantity, ...starters.map(x => x?.quantity as string)]);
			const numeratorQuantities = new Set([target.unit.numeratorQuantity, ...starters.map(x => x?.unit?.numeratorQuantity)]);
			const denominatorQuantities = new Set([target.unit.denominatorQuantity, ...starters.map(x => x?.unit?.denominatorQuantity)]);

			if (usedQuantities.size > 1 || numeratorQuantities.size > 1 || denominatorQuantities.size > 1) return await interaction.reply(`All starting units and the target unit must be of the same quantity. The quantities you used were \`${[...usedQuantities, ...numeratorQuantities, ...denominatorQuantities].filter(x => x)}\``);

			const quantity = [...usedQuantities][0];

			// get absolute value: sum of all starters (starter amount * starter unit value)
			let absolute: number;

			if (starters[0]?.unit?.tempMath) {
				absolute = starters.map(starter => eval(starter?.unit?.tempMath?.toBase)).reduce((a, b) => a + b, 0);
			} else absolute = starters.map(starter => (starter?.amount ?? 0) * (starter?.unit.value ?? 0)).reduce((a, b) => a + b, 0);

			// multiply absolute by the value of the target unit
			let amountInTarget: number;

			if (starters[0]?.unit.tempMath) {
				amountInTarget = eval(target.unit.tempMath?.toSelf as string);
			} else amountInTarget = absolute / target.unit.value;

			// display amount and target unit symbol
			await interaction.reply({ embeds: [new EmbedBuilder()
				.setTitle(`${quantity[0].toUpperCase() + quantity.slice(1)} conversion`)
				.setColor(interaction.client.config.embedColor)
				.addFields(
                    { name: 'Starting amount', value: `${starters.map(x => `${x?.amount.toLocaleString('en-US')} ${x?.unit.short[0]}`).join(', ')}`, inline: true },
                    { name: 'Converted amount', value: `${amountInTarget.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' ' + target.unit.short[0]}`, inline: true })
			] });
		}
	},
	data: new SlashCommandBuilder()
		.setName("convert")
		.setDescription("Use many starting amounts and units by attaching amounts and units of the same quantity with a comma")
		.addSubcommand(x => x
			.setName("help")
			.setDescription("Shows you how to use the command.")
			.addStringOption(x => x
				.setName("type")
				.setDescription("The type of conversion.")
				.setRequired(false)))
		.addSubcommand(x => x
			.setName("convert")
			.setDescription("Convert one quantity to another")
			.addStringOption(x => x
				.setName("starter")
				.setDescription("The starting quantity(s)")
				.setRequired(true))
			.addStringOption(x => x
				.setName('target')
				.setDescription('The target quantity')
				.setRequired(true)))
}