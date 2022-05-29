module.exports = {
    name: "guildMemberUpdate",
    giveaway: false,
    tracker: false,
    frs: false,
    execute: async (client, member) => {
        const guild = client.guilds.cache.get(client.config.mainServer.id);
        
        const df = {
            dfgreen: await guild.roles.fetch(client.config.mainServer.roles.dfgreen),
            dfpurple: await guild.roles.fetch(client.config.mainServer.roles.dfpurple),
            dforange: await guild.roles.fetch(client.config.mainServer.roles.dforange),
            dfyellow: await guild.roles.fetch(client.config.mainServer.roles.dfyellow)
        };
        const df_green = await df.dfgreen.members.map(e=>`${e.displayName}`).join("\n") || " ";
        const df_purple = await df.dfpurple.members.map(e=>`${e.displayName}`).join("\n") || " ";
        const df_orange = await df.dforange.members.map(e=>`${e.displayName}`).join("\n") || " ";
        const df_yellow = await df.dfyellow.members.map(e=>`${e.displayName}`).join("\n") || " ";

        client.channels.cache.get('960980858007859250').messages.fetch('980252747372855316').then((msg)=>{ msg.edit({content: `<@&${client.config.mainServer.roles.dfgreen}>: ${df.dfgreen.members.size}\n${df_green}\n\n<@&${client.config.mainServer.roles.dfpurple}>: ${df.dfpurple.members.size}\n${df_purple}\n\n<@&${client.config.mainServer.roles.dforange}>: ${df.dforange.members.size}\n${df_orange}\n\n<@&${client.config.mainServer.roles.dfyellow}>: ${df.dfyellow.members.size}\n${df_yellow}`, allowedMentions: {roles: false}})})
        
        const tf = {
            trusted: await guild.roles.fetch(client.config.mainServer.roles.trustedfarmer)
        };
        const mp_tf = await tf.trusted.members.map(e=>`<@${e.user.id}>`).join("\n") || " ";
        client.channels.cache.get('718555644801712200').messages.fetch('980240957167521863').then((msg)=>{msg.edit({content: `<@&${client.config.mainServer.roles.trustedfarmer}>: ${tf.trusted.members.size}\n${mp_tf}`, allowedMentions: {roles: false}})})
    }
}