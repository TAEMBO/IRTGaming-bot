import mongoose from 'mongoose';
import YClient from '../client.js';

const model = mongoose.model('userLevels', new mongoose.Schema({
    _id: { type: String },
    messages: { type: Number, required: true },
    level: { type: Number, required: true }
}, { versionKey: false }));

export default class UserLevels {
    public data = model;

    constructor(private client: YClient) { }
    
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
                this.client.getChan('botCommands').send(`Well done <@${userid}>, you made it to **level ${userData.level}**!`);
            }
            await userData.save();
        } else await this.data.create({ _id: userid, messages: 1, level: 0 });
    }
    public algorithm(level: number) {
        return level * level * 15;
    }
}