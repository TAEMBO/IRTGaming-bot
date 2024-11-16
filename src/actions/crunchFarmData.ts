import { EmbedBuilder, type Client } from "discord.js";
import { FTPActions } from "#structures";
import { fs25Servers, jsonFromXML, FM_ICON, TF_ICON } from "#util";
import type { FarmFormat } from "#typings";

export async function crunchFarmData(client: Client, playerTimes: Client["playerTimes25"]["doc"][], serverAcro: string) {
    const server = fs25Servers.getPublicOne(serverAcro);
    const data = await new FTPActions(server.ftp).get("savegame1/farms.xml");
    const farmData = jsonFromXML<FarmFormat>(data);
    const decorators = (name: string) => {
        return (client.fmList.cache.includes(name) ? FM_ICON : "") + (client.tfList.cache.includes(name) ? TF_ICON : "");
    };
    const channel = client.getChan("fsLogs");
    const embed = new EmbedBuilder()
        .setColor(client.config.EMBED_COLOR_YELLOW)
        .setTitle("Player name change")
        .setTimestamp();
    let changedNameCount = 0;
    let addedUuidCount = 0;

    for (const player of farmData.farms.farm[0].players.player) {
        const playerDatabyUuid = playerTimes.find(x => x.uuid === player._attributes.uniqueUserId);

        if (!playerDatabyUuid) {
            const playerDataByName = playerTimes.find(x => x._id === player._attributes.lastNickname);

            if (playerDataByName && !playerDataByName.uuid) {
                await client.playerTimes25.data.findByIdAndUpdate(
                    player._attributes.lastNickname,
                    { uuid: player._attributes.uniqueUserId }
                );

                addedUuidCount++;
            }

            continue;
        }

        // PlayerTimes name matches farm name, no need to update playerTimes data
        if (playerDatabyUuid._id === player._attributes.lastNickname) continue;

        await channel.send({ embeds: [embed.setDescription([
            `**UUID:** \`${playerDatabyUuid.uuid}\``,
            `**Old name:** ${playerDatabyUuid._id} ${decorators(playerDatabyUuid._id)}`,
            `**New name:** ${player._attributes.lastNickname} ${decorators(player._attributes.lastNickname)}`
        ].join("\n"))] });

        changedNameCount++;

        try {
            // Will reject if name (_id) exists
            await client.playerTimes25.data.create({
                _id: player._attributes.lastNickname,
                uuid: player._attributes.uniqueUserId,
                servers: playerDatabyUuid.servers,
                discordid: playerDatabyUuid.discordid
            });

            // Name not occupied, delete old data
            await client.playerTimes25.data.findByIdAndDelete(playerDatabyUuid._id);
        } catch (err) {
            // Name occupied, modify data instead
            playerDatabyUuid.uuid = undefined;

            await playerDatabyUuid.save();

            await client.playerTimes25.data.findByIdAndUpdate(
                player._attributes.lastNickname,
                {
                    uuid: player._attributes.uniqueUserId,
                    discordid: playerDatabyUuid.discordid
                }
            );
        }
    }

    await channel.send([
        `⚠️ Farm data cruncher ran on ${server.fullName}`,
        `Iterated over ${changedNameCount} changed names`,
        `Added playerTimes UUID data to ${addedUuidCount} names`
    ].join("\n"));
};