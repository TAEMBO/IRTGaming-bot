import { type Client, EmbedBuilder } from "discord.js";
import { eq } from "drizzle-orm";
import { db, playerTimes22Table } from "#db";
import { FTPActions } from "#structures";
import { jsonFromXML, FM_ICON, TF_ICON, fetchDBData, log } from "#util";
import type { FSServerPublic, FarmFormat } from "#typings";

export function getTimeData(data: typeof playerTimes22Table.$inferSelect) {
    return Object.entries(data.servers).filter((x) => x[1] !== null);
}

export async function addPlayerTime(playerName: string, playerTime: number, serverAcro: string) {
    const now = Math.floor(Date.now() / 1_000);
    const playerData = (await db.select().from(playerTimes22Table).where(eq(playerTimes22Table.name, playerName))).at(0);

    if (!playerData) {
        await db.insert(playerTimes22Table).values({
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
        .update(playerTimes22Table)
        .set({
            servers: {
                ...playerData.servers,
                [serverAcro]: {
                    time: (playerData.servers[serverAcro]?.time ?? 0) + playerTime,
                    lastOn: now
                }
            }
        })
        .where(eq(playerTimes22Table.name, playerName));
}

export async function fetchFarmData(client: Client, serverAcro: string, server: FSServerPublic) {
    const dbData = await fetchDBData("22");
    const data = await new FTPActions(server.ftp).get("savegame1/farms.xml");

    log("yellow", `Downloaded farms.xml from ${serverAcro}, crunching...`);

    const farmData = jsonFromXML<FarmFormat>(data);
    let changedNameCount = 0;
    let addedUuidCount = 0;

    for (const player of farmData.farms.farm[0].players.player) {
        const playerDatabyUuid = dbData.playerTimesData.find(x => x.uuid === player._attributes.uniqueUserId);

        if (!playerDatabyUuid) {
            const playerDataByName = dbData.playerTimesData.find(x => x.name === player._attributes.lastNickname);

            if (playerDataByName && !playerDataByName.uuid) {
                await db
                    .update(playerTimes22Table)
                    .set({ uuid: player._attributes.uniqueUserId })
                    .where(eq(playerTimes22Table.name, player._attributes.lastNickname));

                addedUuidCount++;
            }

            continue;
        }

        if (playerDatabyUuid.name === player._attributes.lastNickname) continue; // PlayerTimes name matches farm name, no need to update playerTimes data

        const decorators = (name: string) => {
            return [
                dbData.fmNamesData.some(x => x.name === name) ? FM_ICON : "",
                dbData.tfNamesData.some(x => x.name === name) ? TF_ICON : ""
            ].join("");
        };

        await client.getChan("fsLogs").send({ embeds: [new EmbedBuilder()
            .setColor(client.config.EMBED_COLOR_YELLOW)
            .setTitle("Player name change")
            .setTimestamp()
            .setDescription([
                `**UUID:** \`${playerDatabyUuid.uuid}\``,
                `**Old name:** \`${playerDatabyUuid.name}\` ${decorators(playerDatabyUuid.name)}`,
                `**New name:** \`${player._attributes.lastNickname}\` ${decorators(player._attributes.lastNickname)}`
            ].join("\n"))
        ] });

        changedNameCount++;

        const rowExists = Boolean((await db
            .select()
            .from(playerTimes22Table)
            .where(eq(playerTimes22Table.name, player._attributes.lastNickname))
        ).at(0));

        if (rowExists) {
            await db.insert(playerTimes22Table).values({
                name: player._attributes.lastNickname,
                uuid: player._attributes.uniqueUserId,
                servers: playerDatabyUuid.servers,
                discordId: playerDatabyUuid.discordId
            });

            await db.delete(playerTimes22Table).where(eq(playerTimes22Table.name, playerDatabyUuid.name));
        } else {
            await db
                .update(playerTimes22Table)
                .set({
                    uuid: player._attributes.uniqueUserId,
                    discordId: playerDatabyUuid.discordId
                })
                .where(eq(playerTimes22Table.name, player._attributes.lastNickname));

            await db
                .update(playerTimes22Table)
                .set({
                    uuid: null,
                    discordId: null
                })
                .where(eq(playerTimes22Table.name, playerDatabyUuid.name));
        }
    }

    await client.getChan("fsLogs").send([
        `⚠️ Farm data cruncher ran on ${server.fullName}`,
        `Iterated over ${changedNameCount} changed names`,
        `Added playerTimes UUID data to ${addedUuidCount} names`
    ].join("\n"));

    log("yellow", "Finished crunching farms.xml data");
}