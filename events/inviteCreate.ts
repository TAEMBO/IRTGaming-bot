import Discord from 'discord.js';
import YClient from '../client';

export default async (client: YClient, invite: Discord.Invite) => (invite.guild as Discord.Guild).invites.fetch().then(invs => invs.forEach(inv => client.invites.set(inv.code, {uses: inv.uses, creator: inv.inviter?.id})));