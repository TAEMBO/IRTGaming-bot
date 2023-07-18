import Discord from 'discord.js';
import YClient from '../client.js';

export default async (client: YClient, invite: Discord.Invite) => client.invites.set(invite.code, { uses: invite.uses, creator: invite.inviter?.id });