import type { Invite } from "discord.js";

export default async (invite: Invite) => invite.client.inviteCache.delete(invite.code);