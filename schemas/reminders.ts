import mongoose from 'mongoose';

const Schema = mongoose.model('reminders', new mongoose.Schema({
    userid: { type: String, required: true },
    content: { type: String, required: true },
    time: { type: Number, required: true },
	ch: { type: String, required: true },
	msg: { type: String, required: true }
}, { versionKey: false }));

export default class reminders extends Schema {
	_content: typeof Schema;
	constructor() {
		super();
		this._content = Schema;
	}
}