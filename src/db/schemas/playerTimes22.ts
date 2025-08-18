import { jsonb, pgTable, text, varchar } from "drizzle-orm/pg-core";

interface PlayerTimes22Server {
    time: number;
    lastOn: number;
}

export const playerTimes22Table = pgTable("playerTimes22", {
    name: text("name").primaryKey(),
    uuid: varchar("uuid", { length: 44 }),
    discordId: text("discord_id"),
    servers: jsonb("servers").$type<Record<string, PlayerTimes22Server>>().notNull(),
});
