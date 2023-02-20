import mongoose from 'mongoose';
import Discord from 'discord.js';
import YClient from '../client';

const Schema = mongoose.model('watchList', new mongoose.Schema({
    _id: { type: String },
    reason: { type: String, required: true }
}));

export default class watchList extends Schema {
    client: YClient;
    _content: typeof Schema;
    constructor(client: YClient) {
		super();
		this.client = client;
		this._content = Schema;
	}
}