import { EmbedBuilder } from "discord.js";
import mongoose from "mongoose";
import type TClient from "../client.js";
import { BaseSchema, FTPActions } from "#structures";
import { FM_ICON, TF_ICON, fs22Servers, jsonFromXML, log } from "#util";
import type { FarmFormat, FSServerPublic } from "#typings";

/** The object for each server a player has been on */
const serverObj = {
    time: { type: Number, required: true },
    lastOn: { type: Number, required: true }
};

/** The object containing all server data for a given player */
const serversObj = Object.fromEntries(fs22Servers.keys().map(x => [x, { type: serverObj, _id: false }]));

const model = mongoose.model("playerTimes22", new mongoose.Schema({
    _id: { type: String, required: true },
    uuid: { type: String },
    discordid: { type: String },
    servers: { type: serversObj, required: true, _id: false }
}, { versionKey: false }));

export class PlayerTimes22 extends BaseSchema<typeof model> {
    public readonly cache: typeof this.obj[] = [];

    public constructor(private readonly _client: TClient) {
        super(model);
    }

    public async refreshCache() {
        const data = await this.data.find();

        Reflect.set(this, "cache", data.map(x => x.toObject()));
    }

    /**
     * Retrieve an array-ified form of a player's server time data.
     * @param data The MongoDB document for the player
     * @returns An array of all server time objects from the player, with the first element for each being the server's acronym
     */
    public getTimeData(data: typeof this.obj) {
        return Object.entries(data.servers).filter((x): x is [string, NonNullable<typeof x[1]>] => x[1] !== null);
    }

    /**
     * Add server-specific time to a player"s data.
     * @param playerName The name of the player, a string
     * @param playerTime The amount of time to add to their data, a number
     * @param serverAcro The lowercase acronym for the server to add the time to, a string
     * @returns The MongoDB document for the player, a Promise
     */
    public async addPlayerTime(playerName: string, playerTime: number, serverAcro: string) {
        const now = Math.round(Date.now() / 1000);
        const playerData = await this.data.findById(playerName);

        if (!playerData) return await this.data.create({
            _id: playerName,
            servers: {
                [serverAcro]: {
                    time: playerTime,
                    lastOn: now
                }
            }
        });

        playerData.servers[serverAcro] = {
            time: (playerData.servers[serverAcro]?.time ?? 0) + playerTime,
            lastOn: now
        };

        return await playerData.save();
    }

    public async fetchFarmData(serverAcro: string, server: FSServerPublic) {
        const allData = await this.data.find();
        const data = await new FTPActions(server.ftp).get("savegame1/farms.xml");

        log("Yellow", `Downloaded farms.xml from ${serverAcro}, crunching...`);

        const farmData = jsonFromXML<FarmFormat>(data);
        let changedNameCount = 0;
        let addedUuidCount = 0;

        for (const player of farmData.farms.farm[0].players.player) {
            const playerDatabyUuid = allData.find(x => x.uuid === player._attributes.uniqueUserId);

            if (!playerDatabyUuid) {
                const playerDataByName = allData.find(x => x._id === player._attributes.lastNickname);

                if (playerDataByName && !playerDataByName.uuid) {
                    await this.data.findByIdAndUpdate(player._attributes.lastNickname, { uuid: player._attributes.uniqueUserId }, { new: true });

                    addedUuidCount++;
                }

                continue;
            }

            if (playerDatabyUuid._id === player._attributes.lastNickname) continue; // PlayerTimes name matches farm name, no need to update playerTimes data

            const decorators = (name: string) => {
                return [
                    this._client.fmList.cache.includes(name) ? FM_ICON : "",
                    this._client.tfList.cache.includes(name) ? TF_ICON : ""
                ].join("");
            };

            await this._client.getChan("fsLogs").send({ embeds: [new EmbedBuilder()
                .setColor(this._client.config.EMBED_COLOR_YELLOW)
                .setTitle("Player name change")
                .setTimestamp()
                .setDescription([
                    `**UUID:** \`${playerDatabyUuid.uuid}\``,
                    `**Old name:** \`${playerDatabyUuid._id}\` ${decorators(playerDatabyUuid._id)}`,
                    `**New name:** \`${player._attributes.lastNickname}\` ${decorators(player._attributes.lastNickname)}`
                ].join("\n"))
            ] });

            changedNameCount++;

            await this.data.create({
                _id: player._attributes.lastNickname,
                uuid: player._attributes.uniqueUserId,
                servers: playerDatabyUuid.servers,
                discordid: playerDatabyUuid.discordid
            })
                .then(() => this.data.findByIdAndDelete(playerDatabyUuid._id)) // New name was not occupied, delete old name data
                .catch(async () => { // New name was occupied
                    await this.data.findByIdAndUpdate(
                        player._attributes.lastNickname,
                        {
                            uuid: player._attributes.uniqueUserId,
                            discordid: playerDatabyUuid.discordid
                        }
                    ); // Add UUID and Discord ID to new name

                    playerDatabyUuid.uuid = undefined; // Remove UUID from old name
                    playerDatabyUuid.discordid = undefined; // Remove Discord ID from old name

                    await playerDatabyUuid.save();
                });
        }

        await this._client.getChan("fsLogs").send([
            `⚠️ Farm data cruncher ran on ${server.fullName}`,
            `Iterated over ${changedNameCount} changed names`,
            `Added playerTimes UUID data to ${addedUuidCount} names`
        ].join("\n"));

        log("Yellow", "Finished crunching farms.xml data");
    }
}