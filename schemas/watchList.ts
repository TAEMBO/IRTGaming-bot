import mongoose from 'mongoose';

const Model = mongoose.model('watchList', new mongoose.Schema({
    _id: { type: String },
    reason: { type: String, required: true }
}, { versionKey: false }));

export default class watchList {
    public _content = Model;
    
    constructor() { }
}