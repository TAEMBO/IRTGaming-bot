import mongoose from "mongoose";
import { BaseSchema } from "#structures";

const model = mongoose.model("watchList", new mongoose.Schema({
    _id: { type: String, required: true },
    reason: { type: String, required: true },
    isSevere: { type: Boolean, required: true },
    reference: { type: String }
}, { versionKey: false }));

export class WatchList extends BaseSchema<typeof model> {
    public constructor() {
        super(model);
    }
}