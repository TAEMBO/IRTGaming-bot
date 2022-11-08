module.exports = {
    name: "guildMemberUpdate",
    execute: async (client, member) => {
        const mp_tf = (await client.guilds.cache.get(client.config.mainServer.id).roles.fetch(client.config.mainServer.roles.trustedfarmer)).members;
        client.channels.cache.get('718555644801712200')?.messages?.fetch('980240957167521863').then((msg)=>{msg.edit(`<@&${client.config.mainServer.roles.trustedfarmer}>: ${mp_tf.size}\n${mp_tf.map(e=>`<@${e.user.id}>`).join("\n") || " "}`)})
    }
}
