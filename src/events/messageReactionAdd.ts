import type { MessageReaction, PartialMessageReaction, PartialUser, User } from "discord.js";

export default async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
    if (
        (reaction.message.embeds[0]?.author?.name?.includes(user.id) && reaction.message.channelId === user.client.config.mainServer.channels.communityIdeas)
        || (reaction.message.author?.id === user.id && reaction.message.channelId === user.client.config.mainServer.channels.mfModSuggestions)
    ) {
        await reaction.users.remove(user.id);
        await reaction.message.reply(`You cannot vote on your own suggestion, ${user}!`).then(msg => setTimeout(async () => await msg.delete(), 10_000));
    }
}