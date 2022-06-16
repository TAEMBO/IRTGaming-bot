const { SlashCommandBuilder } = require("@discordjs/builders");
const axios = require("axios");

module.exports = {
    run: async (client, interaction) => {
        const subCmd = interaction.options.getSubcommand();

        if (subCmd === 'all') {
            let PS;
            let PG;
            let MF;
            
            const msg = await interaction.reply({content: 'Loading <a:IRT_loading:660661301353381898>', fetchReply: true})
            try {
                PS = await axios.get(client.tokens.ps, {timeout: 1000});
            } catch (err) {
                console.log(err)
            }
            try {
                PG = await axios.get(client.tokens.pg, {timeout: 1000});
            } catch (err) {
                console.log(err)
            }
            try {
                MF = await axios.get(client.tokens.mf, {timeout: 1000});
            } catch (err) {
                console.log(err)
            }
            const totalCount = [];
            const embed = new client.embed()
                .setColor(client.config.embedColor)
                if (PS) {
                    await client.FSstatsAll(client, PS, embed, totalCount)
                } 
                if (PG) {
                    await client.FSstatsAll(client, PG, embed, totalCount)
                }
                if (MF) {
                    await client.FSstatsAll(client, MF, embed, totalCount)
                }

                let sum;
                if (totalCount.length === 0) {
                    sum = 0;
                } else {
                    sum = totalCount.reduce(function (previousValue, currentValue) {
                        return previousValue + currentValue;
                    });
                }

                embed.setTitle(`All Servers: ${sum} online`)
                msg.edit({content: null, embeds: [embed]})
        } else if (subCmd === 'ps') {
            client.FSstats(client, interaction, client.tokens.ps);
        } else if (subCmd === 'pg') {
            client.FSstats(client, interaction, client.tokens.pg);
        } else if (subCmd === 'mf') {
            client.FSstats(client, interaction, client.tokens.mf);
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
        .setName("mf")
        .setDescription("Server stats for Multi Farm")
    )
};
