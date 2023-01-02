import Discord from 'discord.js';
import YClient from '../client';

export default {
    async run(client: YClient, invite: Discord.Invite) {
        const newInvites = await (invite.guild as Discord.Guild).invites.fetch();
        newInvites.forEach((inv: Discord.Invite) => client.invites.set(inv.code, {uses: inv.uses, creator: inv?.inviter?.id}));
    }
}