import mongoose from 'mongoose';
import Discord from 'discord.js';
import YClient from '../client.js';

const Schema = mongoose.model('userLevels', new mongoose.Schema({
    _id: { type: String },
    messages: { type: Number, required: true },
    level: { type: Number, required: true }
}, { versionKey: false }));

export default class userLevels extends Schema {
    _content: typeof Schema;
    constructor(public client: YClient) {
		super();
		this.client = client;
		this._content = Schema;
	}
    async incrementUser(userid: string) {
        const userData = await this._content.findById(userid);

        if (userData) {
            userData.messages++;
            if (userData.messages >= this.algorithm(userData.level+2)) {
                while (userData.messages > this.algorithm(userData.level+1)) {
                    userData.level++;
                    console.log(`${userid} EXTENDED LEVELUP ${userData.level}`);
                }
            } else if (userData.messages >= this.algorithm(userData.level+1)) {
                userData.level++
                (this.client.channels.resolve(this.client.config.mainServer.channels.botcommands) as Discord.TextChannel).send({content: `Well done <@${userid}>, you made it to **level ${userData.level + 1}**!`})
            }
            await userData.save();
        } else await this._content.create({ _id: userid, messages: 1, level: 0 });
    }
    algorithm = (level: number) => level * level * 15;
}