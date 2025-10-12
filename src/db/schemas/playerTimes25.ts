import { jsonb, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { UUID_LENGTH } from "#util";

interface PlayerTimes25Server {
    time: number;
    lastOn: number;
}

export const playerTimes25Table = pgTable("playerTimes25", {
    name: text("name").primaryKey(),
    uuid: varchar("uuid", { length: UUID_LENGTH }),
    discordId: text("discord_id"),
    servers: jsonb("servers").$type<Record<string, PlayerTimes25Server>>().notNull(),
});
