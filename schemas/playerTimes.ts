import mongoose from 'mongoose';

const Schema = mongoose.model('playerTimes', new mongoose.Schema({
    _id: { type: String },
    time: { type: Number, required: true },
    lastOn: { type: Number, required: true }
}, { versionKey: false }));

export default class playerTimes extends Schema {
	public _content = Schema;
	constructor() {
		super();
	}
	async addPlayerTime(playerName: string, time: number) {
		const now = Math.round(Date.now() / 1000);
		const playerData = await this._content.findById(playerName);
		if (playerData) {
			return await this._content.findByIdAndUpdate(playerName, { time: playerData.time + time, lastOn: now }, { new: true });
		} else return await this._content.create({ _id: playerName, time, lastOn: now });
	}
}