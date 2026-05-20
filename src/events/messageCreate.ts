import { channelMention, Events, MessageType, time } from "discord.js";
import { incrementUser } from "#db";
import { Event } from "#structures";
import { fsServers, isDCStaff } from "#util";

const privateServers = fsServers.getPrivateAll();

export default new Event({
    name: Events.MessageCreate,
    async run(message) {
        if (
            (
                !message.client.config.toggles.commands
                && !message.client.config.devWhitelist.includes(message.author.id)
            )
            || message.author.bot
            || !message.inGuild()
        ) return;
        // Bot is set to ignore commands and non-dev sent a message, ignore the message

        let automodded = false;

        // RepeatedMessages
        const isWhitelisted = message.client.config.whitelist.bannedWords.some(x => [message.channelId, message.channel.parentId].includes(x));

        if (message.client.config.toggles.automod && !isDCStaff(message.member) && !isWhitelisted) {
            automodded = await message.client.repeatedMessages.triageMessage(message);
        }

        if (automodded) return;

        if (!message.system && !message.client.config.userLevelsBlacklist.includes(message.channelId)) {
            await incrementUser(message.client, message.author.id);
        }

        if (!message.client.config.toggles.autoResponses) return;

        // Temporary welcome message
        if (message.type === MessageType.UserJoin) {
            const now = Date.now();
            const offset = 300_000;
            const content = "<:IRTLogo:552606592298909745> Welcome to IRTGaming!\n" +
                `- Be sure to read through ${channelMention(message.client.config.mainServer.channels.discordRules)}\n` +
                `- If you've come from our public FS25 servers, please see ${channelMention(message.client.config.mainServer.channels.mpRulesAndInfo)}\n` +
                "- Enjoy your stay!\n" +
                `-# Message will be hidden ${time(Math.floor((now + offset) / 1_000), "R")}`;

            const msg = await message.reply({ content, allowedMentions: { repliedUser: true } });

            setTimeout(msg.delete.bind(msg), offset);
        }

        // Private server mod voting
        if (
            privateServers.some(x => x[1].modSuggestions === message.channelId)
            && message.content.includes("http")
        ) {
            await message.react("764965325342244915");
            await message.react("764965659423408148");
        }
    }
});