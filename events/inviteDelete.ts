import Discord from 'discord.js';
import { YClient } from '../client';

export default {
    name: "inviteDelete",
    execute: async (client: YClient, invite: Discord.Invite) =>{
        client.invites.delete(invite.code)
    }
}