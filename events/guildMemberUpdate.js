module.exports = {
    name: "guildMemberUpdate",
    execute: async (client, member) => {
        const tf = {
            trusted: await client.guilds.cache.get(client.config.mainServer.id).roles.fetch(client.config.mainServer.roles.trustedfarmer)
        };
        const mp_tf = await tf.trusted.members.map(e=>`<@${e.user.id}>`).join("\n") || " ";
        client.channels.cache.get('718555644801712200').messages.fetch('980240957167521863').then((msg)=>{msg.edit({content: `<@&${client.config.mainServer.roles.trustedfarmer}>: ${tf.trusted.members.size}\n${mp_tf}`, allowedMentions: {roles: false}})})
    }
}