module.exports = {
    name: "messageReactionAdd",
    execute: async (client, messageReaction, user) => {
        console.log(messageReaction)
        if (messageReaction.message?.embeds[0]?.author?.name?.includes(user.id)) {
            messageReaction.users.remove(user);
            messageReaction.message.reply(`You cannot vote on your own suggestion, <@${user.id}>!`).then((msg)=> setTimeout(()=>msg.delete(), 10000))
        }
    }
}