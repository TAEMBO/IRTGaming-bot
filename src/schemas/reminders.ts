import { EmbedBuilder, type GuildTextBasedChannel } from "discord.js";
import type TClient from "../client.js";
import mongoose from "mongoose";

const model = mongoose.model("reminders", new mongoose.Schema({
    userid: { type: String, required: true },
    content: { type: String, required: true },
    time: { type: Number, required: true },
    ch: { type: String, required: true }
}, { versionKey: false }));

export type RemindersDocument = ReturnType<typeof model.castObject>;

export class Reminders {
    public data = model;
    
    constructor(private readonly _client: TClient) { }


    public setExec(_id: mongoose.Types.ObjectId, timeout: number) {
        setTimeout(async () => {
            if (timeout > 2_147_483_647) return this.setExec(_id, timeout - 2_147_483_647);

            const reminder = await this.data.findById(_id);

            if (!reminder) return;

            const embed = new EmbedBuilder().setTitle("Reminder").setColor(this._client.config.EMBED_COLOR).setDescription(`\`\`\`${reminder.content}\`\`\``);
        
            await this._client.users.send(reminder.userid, { embeds: [embed] })
                .catch(() => (this._client.channels.resolve(reminder.ch) as GuildTextBasedChannel).send({
                    content: `Reminder <@${reminder.userid}>`,
                    embeds: [embed.setFooter({ text: "Failed to DM" })]
                }));

            await this.data.findByIdAndDelete(reminder._id);
        }, timeout > 2_147_483_647 ? 2_147_483_647 : timeout);
    }
}