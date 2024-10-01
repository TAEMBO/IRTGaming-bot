import { EmbedBuilder, Events, time } from "discord.js";
import { Event } from "#structures";
import { formatUser, log } from "#util";

export default new Event({
    name: Events.GuildMemberAdd,
    async run(member) {
        const [newInvites, evadingCase] = await Promise.all([
            member.guild.invites.fetch(),
            member.client.punishments.data.findOne({ "member._id": member.user.id, type: "detain", expired: undefined }),
            member.client.userLevels.data.findByIdAndUpdate(member.id, { hasLeft: false }),
            member.roles.add(member.client.config.mainServer.roles.member).catch(() => log("Red", `Failed to add member role to ${member.id}`))
        ]);
        const usedInvite = newInvites.find(inv => (member.client.inviteCache.get(inv.code)?.uses ?? 0) < (inv.uses ?? 0));
    
        for (const [code, inv] of newInvites) member.client.inviteCache.set(code, { uses: inv.uses ?? 0, creator: inv.inviter?.id ?? "UNKNOWN" });
     
        const embed = new EmbedBuilder()
            .setTitle(`Member Joined: ${member.user.tag}`)
            .setDescription(formatUser(member.user))
            .setColor(member.client.config.EMBED_COLOR_GREEN)
            .setTimestamp()
            .setThumbnail(member.user.displayAvatarURL({ extension: "png", size: 2048 }))
            .setFields({ name: "🔹 Account Created", value: time(member.user.createdAt, "R") });
    
        if (usedInvite) embed.addFields({
            name: "🔹 Invite Data",
            value: `Invite: \`${usedInvite.code}\`\nCreated by: **${usedInvite.inviter?.tag}**`
        });
    
        if (member.client.config.toggles.logs) await member.client.getChan("botLogs").send({ embeds: [embed] });
    
        if (evadingCase) await member.roles.add(member.client.config.mainServer.roles.detained);
    }
});