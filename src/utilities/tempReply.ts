import { Message, MessageCreateOptions } from "discord.js";

/**
 * Send a temporary message reply that deletes after a set timeout in milliseconds. Pings the user in the reply
 * @param message The message to temporarily reply to
 * @param options Options for sending the reply
 */
export async function tempReply(message: Message, options: MessageCreateOptions & { timeout: number; }) {
    await message.reply({ ...options, allowedMentions: { repliedUser: true } }).then(msg => setTimeout(async () => await msg.delete(), options.timeout));
}