import { Invite } from 'discord.js';
import { TClient } from '../typings.js';

export default async (invite: TClient<Invite>) => invite.client.invites.delete(invite.code);