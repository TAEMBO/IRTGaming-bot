import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const watchListTable = pgTable("watchList", {
    name: text("name").primaryKey(),
    reason: text("reason").notNull(),
    isSevere: boolean("is_severe").notNull(),
    reference: text("reference"),
    timestamp: timestamp("time", { withTimezone: true })
});
