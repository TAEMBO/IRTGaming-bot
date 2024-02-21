import { Events } from "discord.js";
import { Event } from "../structures/index.js";
import { tempReply } from "../util/index.js";

export default new Event({
    name: Events.MessageReactionAdd,
    async run(reaction, user) {
        if (
            (
                reaction.message.embeds[0]?.author?.name?.includes(user.id)
                && reaction.message.channelId === user.client.config.mainServer.channels.communityIdeas
            )
            || (
                reaction.message.author?.id === user.id
                && reaction.message.channelId === user.client.config.mainServer.channels.mfModSuggestions
            )
        ) {
            await reaction.users.remove(user.id);
            await tempReply(reaction.message, { content: `You cannot vote on your own suggestion, ${user}!`, timeout: 10_000 });
        }
    }
});