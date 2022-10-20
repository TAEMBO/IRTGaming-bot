module.exports = {
    name: "messageDeleteBulk",
    execute: async (client, messages) => {
        const channel = client.channels.resolve(client.config.mainServer.channels.modlogs);
         if (!client.config.botSwitches.logs) return;
         let text = "";
         messages.forEach((e)=>{
             text += `${e.author.username}: ${e.content}\n`;
         });
         const embed = new client.embed()
         .setTitle(`${messages.size} Messages Were Deleted.`)
         .setDescription(`\`\`\`${text}\`\`\``.slice(0, 3900))
         .addFields({name: 'Channel', value: `<#${messages.first().channel.id}>`})
         .setColor(client.config.embedColor)
         .setTimestamp()
         channel.send({embeds: [embed]})
        
    }
}
