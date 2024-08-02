import mongoose from "mongoose";
import type { Cached } from "#typings";

const model = mongoose.model("fmList", new mongoose.Schema({
    _id: { type: String, required: true },
}, { versionKey: false }));

export type FMListDocument = ReturnType<typeof model.castObject>;

export class FMList implements Cached<FMListDocument["_id"]> {
    public data = model;
    public cache: FMListDocument["_id"][] = [];
    
    public constructor() { }

    public async add(word: FMListDocument["_id"]) {
        const doc = await this.data.create({ _id: word });
        
        this.cache.push(doc._id);

        return this;
    }

    public async remove(word: FMListDocument["_id"]) {
        const doc = await this.data.findByIdAndDelete(word);

        if (!doc) return null;
        
        this.cache.splice(this.cache.indexOf(doc._id), 1);

        return this;
    }

    public async fillCache() {
        const doc = await this.data.find();

        this.cache = doc.map(x => x._id);

        return this;
    }
}