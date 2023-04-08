import mongoose from 'mongoose';

const Schema = mongoose.model('watchList', new mongoose.Schema({
    _id: { type: String },
    reason: { type: String, required: true }
}, { versionKey: false }));

export default class watchList extends Schema {
    public _content = Schema;
    constructor() {
		super();
	}
}