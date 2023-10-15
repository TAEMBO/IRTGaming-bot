import mongoose from 'mongoose';
import type TClient from '../client.js';

const model = mongoose.model('userLevels', new mongoose.Schema({
    _id: { type: String, required: true },
    messages: { type: Number, required: true },
    level: { type: Number, required: true }
}, { versionKey: false }));

export type UserLevelsDocument = ReturnType<typeof model.castObject>;

export default class UserLevels {
    public data = model;

    constructor(private client: TClient) { }
    
    /**
     * Increment a user's userLevels data, or create a document for them if one not found
     * @param userid The Discord ID of the user to increment
     */
    public async incrementUser(userid: string) {
        const userData = await this.data.findById(userid);
        
        if (userData) {
            userData.messages++;
            if (userData.messages >= this.algorithm(userData.level + 2)) {
                while (userData.messages > this.algorithm(userData.level + 1)) {
                    userData.level++;
                    console.log(`${userid} EXTENDED LEVELUP ${userData.level}`);
                }
            } else if (userData.messages >= this.algorithm(userData.level + 1)) {
                userData.level++
                await this.client.getChan('botCommands').send(`Well done <@${userid}>, you made it to **level ${userData.level}**!`);
            }
            await userData.save();
        } else await this.data.create({ _id: userid, messages: 1, level: 0 });
    }

    /**
     * Get the message requirement for a given userLevels level
     * @param level The level to get the requirement for
     * @returns 
     */
    public algorithm(level: number) {
        return level * level * 15;
    }
}