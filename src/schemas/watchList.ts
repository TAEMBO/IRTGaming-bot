import mongoose from "mongoose";

const model = mongoose.model('watchList', new mongoose.Schema({
    _id: { type: String, required: true },
    reason: { type: String, required: true },
    isSevere: { type: Boolean, required: true }
}, { versionKey: false }));

export type WatchListDocument = ReturnType<typeof model.castObject>;

export class WatchList {
    public data = model;
    
    constructor() { }
}