import mongoose from "mongoose";
import type { Cached } from "../typings.js";

const model = mongoose.model('dailyMsgs', new mongoose.Schema({
    _id: { type: Number, required: true },
    count: { type: Number, required: true }
}, { versionKey: false }));

export type DailyMsgsDocument = ReturnType<typeof model.castObject>;

export class DailyMsgs implements Cached<DailyMsgs, DailyMsgsDocument> {
    public data = model;
    public cache: DailyMsgsDocument[] = [];
    
    constructor() { }

    async increment(data: DailyMsgsDocument) {
        const doc = await this.data.create(data);
        
        this.cache.push(doc);

        return this;
    }

    async fillCache() {
        this.cache = await this.data.find();

        return this;
    }
}