import { Invite } from 'discord.js';

export default async (invite: Invite) => invite.client.invites.delete(invite.code);