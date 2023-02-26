import mongoose from 'mongoose';
import Discord from 'discord.js';
import YClient from '../client';

const Schema = mongoose.model('reminders', new mongoose.Schema({
    _id: { type: String },
    content: { type: String, required: true },
    time: { type: Number, required: true }
}, { versionKey: false }));

export default class reminders extends Schema {
	client: YClient;
	_content: typeof Schema;
	constructor(client: YClient) {
		super();
		this.client = client;
		this._content = Schema;
	}
}