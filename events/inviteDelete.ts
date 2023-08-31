import Discord from 'discord.js';
import { TClient } from '../typings.js';

export default async (invite: TClient<Discord.Invite>) => invite.client.invites.delete(invite.code);