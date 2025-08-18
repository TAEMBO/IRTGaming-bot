import {
    db,
    fmNamesTable,
    tfNamesTable,
    whitelistTable,
    watchListTable,
    watchListPingsTable,
    playerTimes22Table,
    playerTimes25Table
} from "#db";

export async function fetchDBData<TGame extends "22" | "25">(game: TGame) {
    const dbData = {
        fmNamesData: await db.select().from(fmNamesTable),
        tfNamesData: await db.select().from(tfNamesTable),
        whitelistData: await db.select().from(whitelistTable),
        watchListData: await db.select().from(watchListTable),
        watchlistPingsData: await db.select().from(watchListPingsTable),
        playerTimesData: await db.select().from(game === "22" ? playerTimes22Table : playerTimes25Table) as (
            TGame extends "22" ? typeof playerTimes22Table.$inferSelect : typeof playerTimes25Table.$inferSelect
        )[]
    };

    return dbData;
}