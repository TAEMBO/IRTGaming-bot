import type { Invite } from "discord.js";

export default async (invite: Invite) => invite.client.inviteCache.set(invite.code, { uses: invite.uses ?? 0, creator: invite.inviter?.id ?? "UNKNOWN" });