import Discord, { EmbedBuilder } from 'discord.js';
import mongoose from 'mongoose';
import YClient from '../client.js';

const Model = mongoose.model('reminders', new mongoose.Schema({
    userid: { type: String, required: true },
    content: { type: String, required: true },
    time: { type: Number, required: true },
	ch: { type: String, required: true }
}, { versionKey: false }));

export default class reminders {
	public _content = Model;
    
	constructor(private client: YClient) { }


    public setExec(_id: mongoose.Types.ObjectId, timeout: number) {
        setTimeout(async () => {
            if (timeout > 2_147_483_647) return this.setExec(_id, timeout - 2_147_483_647);

            const reminder = await this._content.findById(_id);

            if (!reminder) return;

            const embed = new EmbedBuilder().setTitle('Reminder').setColor(this.client.config.embedColor).setDescription(`\`\`\`${reminder.content}\`\`\``);
        
            this.client.users.send(reminder.userid, { embeds: [embed] })
                .catch(() => (this.client.channels.resolve(reminder.ch) as Discord.GuildTextBasedChannel).send({
        		    content: `Reminder <@${reminder.userid}>`,
        		    embeds: [embed.setFooter({ text: 'Failed to DM' })]
        	    }));

        	await this._content.findByIdAndDelete(reminder._id);
        }, timeout > 2_147_483_647 ? 2_147_483_647 : timeout);
    }
}