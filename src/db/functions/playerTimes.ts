import { eq, sql } from "drizzle-orm";
import { db, playerTimesTable } from "#db";
import { log } from "#util";

export type RankedPlayerTimesPlayer = {
    rank: number;
    name: string;
    totalTime: number;
};

export function getTimeData(data: typeof playerTimesTable.$inferSelect) {
    return Object.entries(data.servers).filter((x): x is [string, NonNullable<typeof x[1]>] => x[1] !== null);
}

export async function addPlayerTime(playerName: string, playerTime: number, serverAcro: string) {
    if (playerName.length > 99 || playerName.length === 0) return log("yellow", `Skipping addPlayerTime due to length: "${playerName}"`);

    const now = Math.floor(Date.now() / 1_000);
    const playerTimesData = await getPlayerTimesRow(playerName);

    if (!playerTimesData) {
        await db.insert(playerTimesTable).values({
            name: playerName,
            servers: {
                [serverAcro]: {
                    time: playerTime,
                    lastOn: now
                }
            }
        });

        return;
    }

    await db
        .update(playerTimesTable)
        .set({
            servers: {
                ...playerTimesData.servers,
                [serverAcro]: {
                    time: (playerTimesData.servers[serverAcro]?.time ?? 0) + playerTime,
                    lastOn: now
                }
            }
        })
        .where(eq(playerTimesTable.name, playerName));
}

export async function getPlayerTimesRow(playerName: string) {
    const rows = await db
        .select()
        .from(playerTimesTable)
        .limit(1)
        .where(eq(playerTimesTable.name, playerName));

    return rows.at(0) ?? null;
}

export async function getPlayerTimesLeaderboard(playerName?: string) {
    const leaderboard = db.$with("leaderboard").as(
        db.select({
            name: playerTimesTable.name,
            totalTime: sql<number>`
                (
                    SELECT COALESCE(SUM((server.value->>'time')::bigint), 0)
                    FROM jsonb_each(${playerTimesTable.servers}) AS server
                )
            `.mapWith(Number).as("total_time"),
        })
            .from(playerTimesTable)
    );

    const ranked = db.$with("ranked").as(
        db.with(leaderboard)
            .select({
                rank: sql<number>`
                    ROW_NUMBER() OVER (ORDER BY ${leaderboard.totalTime} DESC)
                `.mapWith(Number).as("rank"),
                name: leaderboard.name,
                totalTime: leaderboard.totalTime,
            })
            .from(leaderboard)
    );

    if (playerName) {
        return await db
            .with(leaderboard, ranked)
            .select()
            .from(ranked)
            .where(eq(ranked.name, playerName));
    } else {
        return await db
            .with(leaderboard, ranked)
            .select()
            .from(ranked)
            .limit(50);
    }
}