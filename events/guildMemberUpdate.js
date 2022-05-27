module.exports = {
    name: "guildMemberUpdate",
    giveaway: false,
    tracker: false,
    frs: false,
    execute: async (client, member) => {
        const guild = client.guilds.cache.get(client.config.mainServer.id);
        
        const df = {
            dfgreen: await guild.roles.fetch(client.config.mainServer.roles.dfgreen),
            dfblue: await guild.roles.fetch(client.config.mainServer.roles.dfblue),
            dforange: await guild.roles.fetch(client.config.mainServer.roles.dforange),
            dfyellow: await guild.roles.fetch(client.config.mainServer.roles.dfyellow)
        };
        const df_green = await df.dfgreen.members.map(e=>`<@${e.user.id}>`).join("\n") || " ";
        const df_blue = await df.dfblue.members.map(e=>`<@${e.user.id}>`).join("\n") || " ";
        const df_orange = await df.dforange.members.map(e=>`<@${e.user.id}>`).join("\n") || " ";
        const df_yellow = await df.dfyellow.members.map(e=>`<@${e.user.id}>`).join("\n") || " ";

        client.channels.cache.get('778848112588095559').messages.fetch('978864042124906547').then((msg)=>{ msg.edit({embeds: [new client.embed(msg.embeds[0])
            .setDescription(`<@&${client.config.mainServer.roles.dfgreen}>: ${df.dfgreen.members.size}\n${df_green}\n\n<@&${client.config.mainServer.roles.dfblue}>: ${df.dfblue.members.size}\n${df_blue}\n\n<@&${client.config.mainServer.roles.dforange}>: ${df.dforange.members.size}\n${df_orange}\n\n<@&${client.config.mainServer.roles.dfyellow}>: ${df.dfyellow.members.size}\n${df_yellow}`)]})})
        
        const tf = {
            trusted: await guild.roles.fetch(client.config.mainServer.roles.trustedfarmer)
        };
        const mp_tf = await tf.trusted.members.map(e=>`<@${e.user.id}>`).join("\n") || " ";
        client.channels.cache.get('778848112588095559').messages.fetch('979534380349419520').then((msg)=>{msg.edit({content: `<@&${client.config.mainServer.roles.trustedfarmer}>: ${tf.dfgreen.members.size}\n${mp_tf}`, allowedMentions: {roles: false}})})
    }
}