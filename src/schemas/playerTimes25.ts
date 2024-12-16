import mongoose from "mongoose";
import { BaseSchema } from "#structures";
import { fs25Servers } from "#util";

/** The object for each server a player has been on */
const serverObj = {
    time: { type: Number, required: true },
    lastOn: { type: Number, required: true }
};

/** The object containing all server data for a given player */
const serversObj = Object.fromEntries(fs25Servers.keys().map(x => [x, { type: serverObj, _id: false }]));

const model = mongoose.model("playerTimes25", new mongoose.Schema({
    _id: { type: String, required: true },
    uuid: { type: String },
    discordid: { type: String },
    servers: { type: serversObj, required: true, _id: false }
}, { versionKey: false }));

export class PlayerTimes25 extends BaseSchema<typeof model> {
    public readonly cache: typeof this.obj[] = [];

    public constructor() {
        super(model);
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
        const now = Math.round(Date.now() / 1_000);
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
}