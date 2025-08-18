import { db, userLevelsTable } from "#db";
import { type Client, userMention } from "discord.js";
import { eq } from "drizzle-orm";

export async function incrementUser(client: Client, userId: string) {
    const userLevelsdata = (await db.select().from(userLevelsTable).where(eq(userLevelsTable.userId, userId))).at(0);

    if (!userLevelsdata) return db.insert(userLevelsTable).values({ userId, messageCount: 1, level: 0 });

    let updatedLevel = userLevelsdata.level;

    if (userLevelsdata.messageCount >= algorithm(userLevelsdata.level + 2)) {
        while (userLevelsdata.messageCount > algorithm(userLevelsdata.level + 1)) {
            updatedLevel++;

            console.log(`${userId} EXTENDED LEVELUP ${updatedLevel}`);
        }
    } else if (userLevelsdata.messageCount >= algorithm(userLevelsdata.level + 1)) {
        updatedLevel++;

        await client.getChan("botCommands").send(`Well done ${userMention(userId)}, you made it to **level ${updatedLevel}**!`);
    }

    await db
        .update(userLevelsTable)
        .set({ level: updatedLevel, messageCount: userLevelsdata.messageCount + 1 })
        .where(eq(userLevelsTable.userId, userId));
}

export function algorithm(level: number) {
    return level * level * 15;
}