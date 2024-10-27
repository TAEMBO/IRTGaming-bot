import { EmbedBuilder, Events, time } from "discord.js";
import { Event } from "#structures";
import { formatUser } from "#util";

export default new Event({
    name: Events.GuildMemberRemove,
    async run(member) {
        const rankingData = await member.client.userLevels.data.findById(member.id);
        const embed = new EmbedBuilder()
            .setTitle(`Member Left: ${member.user.tag}`)
            .setDescription(formatUser(member.user))
            .addFields(
                { name: "🔹 Account Created", value: time(member.user.createdAt, "R") },
                { name: "🔹 Joined server", value: time(member.joinedAt!, "R") },
                {
                    name: `🔹 Roles: ${member.roles.cache.size - 1}`,
                    value: member.roles.cache.size > 1
                        ? member.roles.cache
                            .filter(x => x.id !== member.client.config.mainServer.id)
                            .sort((a, b) => b.position - a.position)
                            .map(x => x.toString())
                            .join(member.roles.cache.size > 4 ? " " : "\n")
                            .slice(0, 1024)
                        : "None",
                    inline: true
                }
            )
            .setTimestamp()
            .setColor(member.client.config.EMBED_COLOR_RED)
            .setThumbnail(member.user.displayAvatarURL({ extension: "png", size: 2048 }));

        if (rankingData && rankingData.messages) embed.addFields({ name: "🔹 Ranking Total", value: rankingData.messages.toLocaleString("en-US"), inline: true });

        if (member.client.config.toggles.logs) {
            await member.client.getChan("botLogs").send({ embeds: [embed] });

            await member.client.getChan("leaveLogs").send(`**${member.user.tag}** left the server.`);
        }

        if (!rankingData) return;

        rankingData.hasLeft = true;

        await rankingData.save();
    }
});