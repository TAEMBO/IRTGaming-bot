import { MessageReaction, User } from 'discord.js';

export default async (messageReaction: MessageReaction, user: User) => {
    if (messageReaction.message?.embeds[0]?.author?.name?.includes(user.id) && messageReaction.message.channel.id === user.client.config.mainServer.channels.communityIdeas) {
        await messageReaction.users.remove(user);
        await messageReaction.message.reply(`You cannot vote on your own suggestion, <@${user.id}>!`).then(msg => setTimeout(async () => await msg.delete(), 10_000));
    }
}