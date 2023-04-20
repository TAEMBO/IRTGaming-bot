import Discord from 'discord.js';
import YClient from '../client.js';

export default async (client: YClient, invite: Discord.Invite) => (await (invite.guild as Discord.Guild).invites.fetch()).forEach(inv => client.invites.set(inv.code, {uses: inv.uses, creator: inv.inviter?.id}));