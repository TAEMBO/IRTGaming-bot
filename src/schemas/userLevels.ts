import mongoose from "mongoose";
import type TClient from "../client.js";
import { BaseSchema } from "#structures";

const model = mongoose.model("userLevels", new mongoose.Schema({
    _id: { type: String, required: true },
    messages: { type: Number, required: true },
    level: { type: Number, required: true },
    hasLeft: { type: Boolean, required: false }
}, { versionKey: false }));

export class UserLevels extends BaseSchema<typeof model> {

    public constructor(private readonly _client: TClient) {
        super(model);
    }

    /**
     * Increment a user"s userLevels data, or create a document for them if one not found
     * @param userid The Discord ID of the user to increment
     */
    public async incrementUser(userid: string) {
        const userData = await this.data.findById(userid);

        if (!userData) return await this.data.create({ _id: userid, messages: 1, level: 0 });

        userData.messages++;

        if (userData.messages >= this.algorithm(userData.level + 2)) {
            while (userData.messages > this.algorithm(userData.level + 1)) {
                userData.level++;

                console.log(`${userid} EXTENDED LEVELUP ${userData.level}`);
            }
        } else if (userData.messages >= this.algorithm(userData.level + 1)) {
            userData.level++;

            await this._client.getChan("botCommands").send(`Well done <@${userid}>, you made it to **level ${userData.level}**!`);
        }

        await userData.save();
    }

    /**
     * Get the message requirement for a given userLevels level
     * @param level The level to get the requirement for
     */
    public algorithm(level: number) {
        return level * level * 15;
    }
}