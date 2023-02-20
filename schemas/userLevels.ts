import mongoose from 'mongoose';
import Discord from 'discord.js';
import YClient from '../client';

const Schema = mongoose.model('userLevels', new mongoose.Schema({
    _id: { type: String },
    messages: { type: Number, required: true },
    level: { type: Number, required: true }
}));

export default class userLevels extends Schema {
    client: YClient;
    _content: typeof Schema;
    constructor(client: YClient) {
		super();
		this.client = client;
		this._content = Schema;
	}
    async incrementUser(userid: string) {
        const userData = await this._content.findById(userid);

        if (userData) {
            await this._content.findByIdAndUpdate(userid, { messages: userData.messages + 1 });
            if (userData.messages >= this.algorithm(userData.level+2)) {
                while (userData.messages > this.algorithm(userData.level+1)) {
					const newData = await this._content.findByIdAndUpdate(userid, { level: userData.level + 1 }, { new: true });
					console.log(`${userid} EXTENDED LEVELUP ${newData?.level}`);
				}
            } else if (userData.messages >= this.algorithm(userData.level+1)) {
                const newData = await this._content.findByIdAndUpdate(userid, { level: userData.level + 1 }, { new: true });
                (this.client.channels.resolve(this.client.config.mainServer.channels.botcommands) as Discord.TextChannel).send({content: `Well done <@${userid}>, you made it to **level ${newData?.level}**!`})
            }
        } else await this._content.create({ _id: userid, messages: 1, level: 0 });
    }
    algorithm = (level: number) => level * level * 15;
}