import Discord, { EmbedBuilder } from 'discord.js';
import mongoose from 'mongoose';
import YClient from '../client.js';

const model = mongoose.model('reminders', new mongoose.Schema({
    userid: { type: String, required: true },
    content: { type: String, required: true },
    time: { type: Number, required: true },
	ch: { type: String, required: true }
}, { versionKey: false }));

export type RemindersDocument = ReturnType<typeof model.castObject>;

export default class Reminders {
	public data = model;
    
	constructor(private client: YClient) { }


    public setExec(_id: mongoose.Types.ObjectId, timeout: number) {
        setTimeout(async () => {
            if (timeout > 2_147_483_647) return this.setExec(_id, timeout - 2_147_483_647);

            const reminder = await this.data.findById(_id);

            if (!reminder) return;

            const embed = new EmbedBuilder().setTitle('Reminder').setColor(this.client.config.embedColor).setDescription(`\`\`\`${reminder.content}\`\`\``);
        
            await this.client.users.send(reminder.userid, { embeds: [embed] })
                .catch(() => (this.client.channels.resolve(reminder.ch) as Discord.GuildTextBasedChannel).send({
        		    content: `Reminder <@${reminder.userid}>`,
        		    embeds: [embed.setFooter({ text: 'Failed to DM' })]
        	    }));

        	await this.data.findByIdAndDelete(reminder._id);
        }, timeout > 2_147_483_647 ? 2_147_483_647 : timeout);
    }
}