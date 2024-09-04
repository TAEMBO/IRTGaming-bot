import mongoose from "mongoose";
import { BaseSchema } from "#structures";

const model = mongoose.model("dailyMsgs", new mongoose.Schema({
    _id: { type: Number, required: true },
    count: { type: Number, required: true }
}, { versionKey: false }));

export class DailyMsgs extends BaseSchema<typeof model> {
    public constructor() {
        super(model);
    }
}