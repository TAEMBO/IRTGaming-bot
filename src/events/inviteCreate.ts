import { Invite } from 'discord.js';

export default async (invite: Invite) => invite.client.invites.set(invite.code, { uses: invite.uses, creator: invite.inviter?.id });