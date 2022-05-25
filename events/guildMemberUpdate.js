module.exports = {
    name: "guildMemberUpdate",
    giveaway: false,
    tracker: false,
    frs: false,
    execute: async (client, member) => {
        const guild = client.guilds.cache.get(client.config.mainServer.id);
        
        const staff = {
            moderator: await guild.roles.fetch(client.config.mainServer.roles.mod),
            trialmoderator: await guild.roles.fetch(client.config.mainServer.roles.minimod),
            botdev: await guild.roles.fetch(client.config.mainServer.roles.botdeveloper)
        };
        const mod = await staff.moderator.members.filter(x=>!x.roles.cache.has(client.config.mainServer.roles.admin)).map(e=>`<@${e.user.id}>`).join("\n") || " ";
        const tm = await staff.trialmoderator.members.map(e=>`<@${e.user.id}>`).join("\n") || " ";
        const bot_dev = await staff.botdev.members.map(e=>`<@${e.user.id}>`).join("\n") || " ";

        client.channels.cache.get('940726714915495946').messages.fetch('970386809781624954').then((msg)=>{ msg.edit({embeds: [new client.embed(msg.embeds[0])
            .setDescription(`<@&${client.config.mainServer.roles.mod}>: ${staff.moderator.members.filter(x=>!x.roles.cache.has(client.config.mainServer.roles.admin)).size}\n${mod}\n\n<@&${client.config.mainServer.roles.minimod}>: ${staff.trialmoderator.members.size}\n${tm}\n\n<@&${client.config.mainServer.roles.botdeveloper}>: ${staff.botdev.members.size}\n${bot_dev}`)]})})
        
    }
}