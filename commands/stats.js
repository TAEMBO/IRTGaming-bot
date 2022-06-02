const { SlashCommandBuilder } = require("@discordjs/builders");
const axios = require("axios");

module.exports = {
    run: async (client, interaction) => {
        const subCmd = interaction.options.getSubcommand();

        if (subCmd === 'all') {
            let PS;
            let PG;
            let DF;
            let RF;
            
            const msg = await interaction.reply({content: 'Loading <a:IRT_loading:660661301353381898>', fetchReply: true})
            try {
                PS = await axios.get(client.tokens.ps, {timeout: 500});
            } catch (err) {
                console.log(err)
            }

            try {
                PG = await axios.get(client.tokens.pg, {timeout: 500});
            } catch (err) {
                console.log(err)
            }
            try {
                DF = await axios.get(client.tokens.df, {timeout: 500});
            } catch (err) {
                console.log(err)
            }
            try {
                RF = await axios.get(client.tokens.rf, {timeout: 500});
            } catch (err) {
                console.log(err)
            }
            const totalCount = [];
            const embed = new client.embed()
                .setColor(client.config.embedColor)
                .setTitle('All Servers')
                if (PS) {
                    await client.FSstatsAll(client, PS, embed, totalCount)
                } 
                if (PG) {
                    await client.FSstatsAll(client, PG, embed, totalCount)
                }
                if (DF) {
                    await client.FSstatsAll(client, DF, embed, totalCount)
                }
                if (RF) {
                    await client.FSstatsAll(client, RF, embed, totalCount)
                }

                let sum;
                if (totalCount.length === 0) {
                    sum = 0;
                } else {
                    sum = totalCount.reduce(function (previousValue, currentValue) {
                        return previousValue + currentValue;
                    });
                }

                console.log(sum)
                embed.setDescription(`**${sum}** total players online across all servers.`)
                msg.edit({content: null, embeds: [embed]})
        } else if (subCmd === 'ps') {
            client.FSstats(client, interaction, client.tokens.ps);
        } else if (subCmd === 'pg') {
            client.FSstats(client, interaction, client.tokens.pg);
        } else if (subCmd === 'df') {
            client.FSstats(client, interaction, client.tokens.df);
        } else if (subCmd === 'rf') {
            client.FSstats(client, interaction, client.tokens.rf);
        }
    },
    data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Gets info on an FS22 server")
    .addSubcommand((optt)=>optt
        .setName("all")
        .setDescription("Server stats for all servers")
    )
    .addSubcommand((optt)=>optt
        .setName("ps")
        .setDescription("Server stats for Public Silage")
    )
    .addSubcommand((optt)=>optt
        .setName("pg")
        .setDescription("Server stats for Public Grain")
    )
    .addSubcommand((optt)=>optt
        .setName("df")
        .setDescription("Server stats for Discord Farm")
    )
    .addSubcommand((optt)=>optt
    .setName("rf")
    .setDescription("Server stats for Realistic Farm")
    )
};
