import mongoose from "mongoose";
import { BaseCachedSchema } from "#structures";

const model = mongoose.model("whitelist", new mongoose.Schema({
    _id: { type: String, required: true },
}, { versionKey: false }));

export class Whitelist extends BaseCachedSchema<typeof model> {
    public constructor() {
        super(model);
    }
}