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

    public async refreshCache() {
        const data = await this.data.find();

        Reflect.set(this, "cache", data.map(x => x.toObject()));
    }

    public getTimeData(data: typeof this.obj) {
        return Object.entries(data.servers).filter((x): x is [string, NonNullable<typeof x[1]>] => x[1] !== null);
    }

    public async addPlayerTime(playerName: string, playerTime: number, serverAcro: string) {
        const now = Math.floor(Date.now() / 1_000);
        const playerData = await this.data.findById(playerName);

        if (!playerData) {
            await this.data.create({
                _id: playerName,
                servers: {
                    [serverAcro]: {
                        time: playerTime,
                        lastOn: now
                    }
                }
            });

            return;
        }

        playerData.servers[serverAcro] = {
            time: (playerData.servers[serverAcro]?.time ?? 0) + playerTime,
            lastOn: now
        };

        await playerData.save();
    }
}