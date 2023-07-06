import mongoose from 'mongoose';

const Model = mongoose.model('reminders', new mongoose.Schema({
    userid: { type: String, required: true },
    content: { type: String, required: true },
    time: { type: Number, required: true },
	ch: { type: String, required: true }
}, { versionKey: false }));

export default class reminders {
	public _content = Model;
    
	constructor() { }
}