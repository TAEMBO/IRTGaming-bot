import mongoose from 'mongoose';

const model = mongoose.model('watchList', new mongoose.Schema({
    _id: { type: String },
    reason: { type: String, required: true }
}, { versionKey: false }));

export default class WatchList {
    public data = model;
    
    constructor() { }
}