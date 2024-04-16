import mongoose from "mongoose";

const model = mongoose.model("mcPlayerTimes", new mongoose.Schema({
    _id: { type: String, required: true },
    playerName: { type: String, required: true },
    time: { type: Number, required: true },
    lastOn: { type: Number, required: true },
    deaths: { type: Number, required: true },
}, { versionKey: false }));

export type MCPlayerTimesDocument = ReturnType<typeof model.castObject>;

export class MCPlayerTimes {
    public data = model;

    public constructor() { }

    /**
     * Add time to a player's time
     * @param playerUuid The UUID of the player
     * @param playerName The name of the player
     * @param playerTime The amount of time in milliseconds to add
     */
    public async addPlayerTime(playerUuid: string, playerName: string, playerTime: number) {
        const playerData = await this.data.findById(playerUuid);

        if (playerData) {
            playerData.time = playerData.time + playerTime;
            playerData.lastOn = Date.now();

            await playerData.save();
        } else await this.data.create({
            _id: playerUuid,
            playerName,
            time: playerTime,
            lastOn: Date.now(),
            deaths: 0
        });
    }

    /**
     * Increment a player's death count
     * @param playerUuid The UUID of the player
     * @param playerName The name of the player
     */
    public async addDeath(playerUuid: string, playerName: string) {
        const playerData = await this.data.findById(playerUuid);

        if (playerData) {
            playerData.deaths++;

            await playerData.save();
        } else await this.data.create({
            _id: playerUuid,
            playerName,
            time: 0,
            lastOn: Date.now(),
            deaths: 1
        });
    }
}