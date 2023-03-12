import mongoose from 'mongoose';

const Schema = mongoose.model('reminders', new mongoose.Schema({
    _id: { type: String },
    content: { type: String, required: true },
    time: { type: Number, required: true }
}, { versionKey: false }));

export default class reminders extends Schema {
	_content: typeof Schema;
	constructor() {
		super();
		this._content = Schema;
	}
}