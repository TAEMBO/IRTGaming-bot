const {ActionRowBuilder, ButtonBuilder} = require("discord.js");
const moment = require('moment');

module.exports = {
    name: "interactionCreate",
    execute: async (client, interaction) => {
        if (interaction.isButton()) {
            const sugges = ["suggestion-decline", "suggestion-upvote"]
            if (sugges.includes(interaction.customId)) {
                const hasVoted = client.votes._content.includes(`${interaction.user.id}: ${interaction.message.id}`)
                // reactions regarding suggestions only happen in the suggestions channel so return if this event didnt originate from the suggestions channel
                if (interaction.channel.id !== client.config.mainServer.channels.suggestions) return;
                let upvotes;
                let downvotes;
                interaction.message.components.forEach((a)=>{
                    a.components.forEach((ton)=>{
                        if(ton.customId === "suggestion-decline"){
                            downvotes = parseInt(ton.label)
                        } else if (ton.customId === "suggestion-upvote"){
                            upvotes = parseInt(ton.label)
                        }
                    })
                })
                if (hasVoted) {
                    console.log(interaction.user.id + 'h' + client.voted)
                    if (client.voted === interaction.user.id) {
                        interaction.deferUpdate();
                        console.log(`a ${client.voted}`);
                        return;
                    }
                    const msg = await interaction.reply({content: 'You\'ve already voted on this suggestion! Do you want to remove your vote?', fetchReply: true, ephemeral: true, components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`Yes`).setStyle("Success").setLabel("Confirm"), new ButtonBuilder().setCustomId(`No`).setStyle("Danger").setLabel("Cancel"))]});
                    client.voted = interaction.user.id;
                    console.log(client.voted)
                    const filter = (i) => ["Yes", "No"].includes(i.customId) && i.user.id === interaction.user.id;
                    const collector = interaction.channel.createMessageComponentCollector({filter, max: 1, time: 30000, errors: ['time']});
                    collector.on("collect", async (int) => {
                        if(int.customId === "Yes"){
                            const fs = require('node:fs');
                            const path = require("path");
                            const name = `${interaction.user.id}: ${interaction.message.id}`;
                            let arr = require('../databases/suggestvotes.json');
                            
                            arr = client.removeCustomValue(arr, name)
                            fs.writeFileSync(path.resolve('./databases/suggestvotes.json'), JSON.stringify(arr))
                            client.votes._content = require("../databases/suggestvotes.json");
                            const ee = parseInt(interaction.component.label) - 1;
                            if (interaction.customId === "suggestion-decline") {
                                await UpdateButton(ee, downvotes, interaction.message, interaction.user.id)
                            } else if (interaction.customId === "suggestion-upvote") {
                                await UpdateButton(upvotes, ee, interaction.message, interaction.user.id)
                            }
                            int.update({content: 'Vote removed!', components: []})
                            client.voted = undefined;
                            console.log(`v: '${client.voted}"`)
                        } else if (int.customId === "No") {
                            int.update({content: 'Command canceled!', components: []});
                            client.voted = undefined;
                            console.log(`v: '${client.voted}"`)
                        }
                    })
                    collector.on('end', c => client.voted = undefined);
                } else if (interaction.message.embeds[0].author.name.includes(interaction.user.id)) {
                    interaction.reply({content: 'You can\'t vote on your own suggestion!', ephemeral: true})        
                } else if (interaction.customId === "suggestion-decline"){
                    const ee = parseInt(interaction.component.label) + 1;
                    await UpdateButtons(upvotes, ee, interaction.message, interaction.user.id)
                    interaction.reply({content: '❌ Downvote recorded!', ephemeral: true})
                } else if (interaction.customId === "suggestion-upvote") {
                    const ee = parseInt(interaction.component.label) + 1;
                    await UpdateButtons(ee, downvotes, interaction.message, interaction.user.id)
                    interaction.reply({content: '✅ Upvote recorded!', ephemeral: true})
                }

                async function UpdateButton(upvotes, downvotes = Number, message, user){
                    message.edit({embeds: [message.embeds[0]], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle("Success").setEmoji("✅").setCustomId("suggestion-upvote").setLabel(`${upvotes}`), new ButtonBuilder().setStyle("Danger").setEmoji("❌").setCustomId("suggestion-decline").setLabel(`${downvotes}`))]});
                }
    
                async function UpdateButtons(upvotes, downvotes = Number, message, user){
                    message.edit({embeds: [message.embeds[0]], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle("Success").setEmoji("✅").setCustomId("suggestion-upvote").setLabel(`${upvotes}`), new ButtonBuilder().setStyle("Danger").setEmoji("❌").setCustomId("suggestion-decline").setLabel(`${downvotes}`))]});
                    await client.votes.addData(`${user}: ${message.id}`).forceSave();
                }
            }
        } else if (interaction.isCommand()) {
            const commandFile = client.commands.get(interaction.commandName);
            if (!client.config.botSwitches.commands && !client.config.devWhitelist.includes(interaction.user.id)) return interaction.reply({content: 'Commands are currently disabled.', ephemeral: true});
            if (commandFile) {
                if (commandFile.disabled) return interaction.reply({content: 'This command is disabled.', ephemeral: true});
                console.log(`[${moment().format('HH:mm:ss')}] ${interaction.user.tag} used /${interaction.commandName} in ${interaction.channel.name}`);
                try {
                    commandFile.run(client, interaction);
                    commandFile.uses ? commandFile.uses++ : commandFile.uses = 1;
                } catch (error) {
                    console.log(`An error occured while running command "${commandFile.name}"`, error, error.stack);
                    return interaction.reply("An error occured while executing that command.");
                }
            }
        }
   }
}
