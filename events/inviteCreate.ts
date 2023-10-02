import { Invite } from 'discord.js';
import { TClient } from '../typings.js';

export default async (invite: TClient<Invite>) => invite.client.invites.set(invite.code, { uses: invite.uses, creator: invite.inviter?.id });