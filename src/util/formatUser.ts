import type { User } from "discord.js";

/**
 * 
 * @param user 
 * @returns A string with the given user"s tag, global name if present, and codeblocked ID
 */
export function formatUser(user: User) {
    if (user.globalName) {
        return [
            user.toString(),
            user.globalName,
            `\`${user.id}\``
        ].join("\n");
    } else return [
        user.toString(),
        `\`${user.id}\``
    ].join("\n");
}