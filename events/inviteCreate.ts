import Discord from 'discord.js';
import { YClient } from '../client';

export default {
    name: "inviteCreate",
    execute: async (client: YClient, invite: Discord.Invite) =>{
        if (!invite.guild) return;
        const newInvites = await (invite.guild as Discord.Guild).invites.fetch();
        newInvites.forEach((inv: Discord.Invite) => client.invites.set(inv.code, {uses: inv.uses, creator: inv?.inviter?.id}));
    }
}