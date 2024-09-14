import type { Client } from "discord.js";
import mongoose from "mongoose";
import { log } from "#util";

export async function connectMongoDB(client: Client) {
    const now = Date.now();

    await mongoose
        .set("strictQuery", true)
        .connect(client.config.MONGO_URI, {
            autoIndex: true,
            serverSelectionTimeoutMS: 5_000,
            socketTimeoutMS: 45_000,
            family: 4,
            waitQueueTimeoutMS: 50_000,
        })
        .then(() => log("Purple", "Connected to MongoDB"));

    await Promise.allSettled([
        client.bannedWords.fillCache(),
        client.fmList.fillCache(),
        client.tfList.fillCache(),
        client.watchListPings.fillCache(),
        client.whitelist.fillCache()
    ]);

    for (const reminder of await client.reminders.data.find()) {
        client.reminders.setExec(reminder._id, reminder.time < now ? 0 : reminder.time - now);
    }

    for (const punishment of await client.punishments.data.find()) {
        if (!punishment.endTime || punishment.expired) continue;

        client.punishments.setExec(punishment._id, punishment.endTime < now ? 0 : punishment.endTime - now);
    }
}
