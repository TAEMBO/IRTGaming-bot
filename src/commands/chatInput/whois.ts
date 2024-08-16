import {
    ActivityType,
    type APIEmbedField,
    ApplicationFlagsBitField,
    type ClientPresenceStatus,
    escapeItalic,
    EmbedBuilder,
    inlineCode,
    SlashCommandBuilder,
    time,
} from "discord.js";
import { Command } from "#structures";
import { formatString, formatUser } from "#util";
import type { ApplicationRPC } from "#typings";

export default new Command<"chatInput">({
    async run(interaction) {
        async function getApplicationData(id: string) {
            const applicationData = (await interaction.client.rest
                .get(`/applications/${id}/rpc`)
                .catch(() => null)) as ApplicationRPC | null;
            const fields: APIEmbedField[] = [];

            if (!applicationData) return;

            if (applicationData.description)
                fields.push({
                    name: "🔹 Bot description",
                    value: applicationData.description,
                });

            if (applicationData.tags?.length)
                fields.push({
                    name: "🔹 Bot tags",
                    value: applicationData.tags.map(inlineCode).join(),
                });

            if (applicationData.flags)
                fields.push({
                    name: "🔹 Bot flags",
                    value: new ApplicationFlagsBitField(applicationData.flags).toArray().map(inlineCode).join(),
                });

            fields.push({ name: "🔹 Bot is public", value: applicationData.bot_public ? "Yes" : "No" });

            return fields;
        }

        function convertStatus(status?: ClientPresenceStatus) {
            return {
                idle: "🟡",
                dnd: "🔴",
                online: "🟢",
                invisible: "⚫",
            }[status ?? "invisible"];
        }

        const member = interaction.options.getMember("member");

        if (!member) {
            const user = interaction.options.getUser("member", true);

            await user.fetch(true);

            const appData = await getApplicationData(user.id);
            const embed = new EmbedBuilder()
                .setThumbnail(user.displayAvatarURL({ extension: "png", size: 2048 }))
                .setTitle(`${user.bot ? "Bot" : "User"} info: ${escapeItalic(user.tag)}`)
                .setURL(`https://discord.com/users/${user.id}`)
                .setDescription(formatUser(user))
                .addFields({ name: `🔹 ${user.bot ? "Bot" : "Account"} created`, value: time(user.createdAt, "R") })
                .setColor(interaction.client.config.EMBED_COLOR)
                .setImage(user.bannerURL({ extension: "png", size: 1024 }) ?? null);

            if (appData) embed.addFields(...appData);

            return await interaction.reply({ embeds: [embed] });
        }

        await member.user.fetch(true);

        const embeds: EmbedBuilder[] = [];
        const titleText = (() => {
            if (member.user.bot) {
                return "Bot";
            } else if (member.user.id === interaction.guild.ownerId) {
                return ":crown: Server Owner";
            } else {
                return "Member";
            }
        })();

        embeds.push(
            new EmbedBuilder()
                .setThumbnail(member.user.displayAvatarURL({ extension: "png", size: 2048 }))
                .setTitle(`${titleText} info: ${escapeItalic(member.user.tag)}`)
                .setURL(`https://discord.com/users/${member.user.id}`)
                .setDescription(formatUser(member.user))
                .addFields(
                    { name: "🔹 Account created", value: time(member.user.createdAt, "R"), inline: true },
                    { name: "🔹 Joined server", value: time(member.joinedAt!, "R"), inline: true },
                    {
                        name: `🔹 Roles: ${member.roles.cache.size - 1}`,
                        value:
                            member.roles.cache.size > 1
                                ? member.roles.cache
                                      .filter(x => x.id !== interaction.guildId)
                                      .sort((a, b) => b.position - a.position)
                                      .map(x => x)
                                      .join(member.roles.cache.size > 4 ? " " : "\n")
                                      .slice(0, 1024)
                                : "None",
                    },
                )
                .setColor(member.displayColor || "#ffffff")
                .setImage(member.user.bannerURL({ extension: "png", size: 1024 }) ?? null),
        );

        if (member.premiumSince)
            embeds[0].addFields({
                name: "🔹 Server Boosting Since",
                value: time(member.premiumSince, "R"),
                inline: true,
            });

        if (member.user.bot) {
            const appData = await getApplicationData(member.user.id);

            if (appData) embeds[0].addFields(...appData);

            return await interaction.reply({ embeds });
        }

        if (!member.presence) return await interaction.reply({ embeds });

        embeds[0].addFields({
            name: `🔹 Status: ${member.presence.status}`,
            value:
                member.presence.status === "offline"
                    ? "\u200b"
                    : Object.entries(member.presence.clientStatus ?? {})
                          .map(x => `${formatString(x[0])}: ${convertStatus(x[1])}`)
                          .join("\n"),
        });

        for (const activity of member.presence.activities) {
            if (activity.type === ActivityType.Listening && activity.details && activity.assets && activity.name === "Spotify") {
                embeds.push(
                    new EmbedBuilder()
                        .setAuthor({
                            name: activity.name,
                            iconURL: interaction.client.config.resources.whoisSpotifyEmbedAuthorImage,
                        })
                        .setColor("#1DB954")
                        .setTitle(activity.details)
                        .setURL(`https://open.spotify.com/track/${activity.syncId}`)
                        .setDescription(
                            [
                                `by ${activity.state}`,
                                `on ${activity.assets.largeText}`,
                                `Started listening ${time(activity.createdAt, "R")}`,
                            ].join("\n"),
                        )
                        .setThumbnail(activity.assets.largeImageURL()),
                );
            } else if (activity.type === ActivityType.Custom) {
                embeds.push(
                    new EmbedBuilder()
                        .setTitle(activity.name)
                        .setColor("#ffffff")
                        .setDescription(
                            [
                                activity.emoji ? `**Emoji name:** ${activity.emoji.name}` : "",
                                activity.state ? `\n**Text:** ${activity.state}` : "",
                            ].join(""),
                        ),
                );
            } else {
                const formatImgURL = (type: "assets" | "icons", path: string | null | undefined) => {
                    return `https://cdn.discordapp.com/app-${type}/${activity.applicationId}/${path}.png`;
                };

                const activityImages: Record<string, string> = {
                    "1129504162200166401": formatImgURL("icons", "469676e3ad37898c0289283c30c2c882"), // Farming Simulator 22
                    "542474758835535872": formatImgURL("icons", "37b18c2d5633628d936dd3b2b083785b"), // Farming Simulator 19
                    "363426921612181504": formatImgURL("icons", "61bed87d2da8e32dd8f24423a9e83323"), // Farming Simulator 17
                    "451556128992657418": formatImgURL("icons", "48cfba535d49560a086fe55de2e2743b"), // Farming Simulator 15
                    "732565262704050298": formatImgURL("assets", activity.assets?.largeImage), // Visual Studio Code
                    "383226320970055681": formatImgURL("assets", activity.assets?.largeImage), // Visual Studio Code
                    "356875570916753438": formatImgURL("icons", "166fbad351ecdd02d11a3b464748f66b"), // Minecraft
                    "438122941302046720": "https://discord.com/assets/29b4af8bf13fa73258692008d25b4f0d.png", // Xbox
                    "356876176465199104": formatImgURL("icons", "069d9f4871b5ebd2f62bd342ce6ba77f"), // Grand Theft Auto V
                    "363445589247131668": formatImgURL("icons", "f2b60e350a2097289b3b0b877495e55f"), // Roblox
                    "356876590342340608": formatImgURL("icons", "554af7ef210877b5f04fd1b727a3746e"), // Rainbow Six Siege
                    "445956193924546560": formatImgURL("assets", activity.assets?.largeImage), // Rainbow Six Siege
                    "432980957394370572": formatImgURL("assets", activity.assets?.largeImage), // Fortnite
                };

                let activityImage: string | null | undefined = activityImages[activity.applicationId ?? ""] as string | undefined;

                if (!activityImage) activityImage = activity.assets?.largeImageURL(); // PlayStation
                if (!activityImage) activityImage = activity.assets?.smallImageURL(); // Residual images

                embeds.push(
                    new EmbedBuilder()
                        .setTitle(activity.name)
                        .setColor("#ffffff")
                        .setDescription(
                            [
                                `\u200b**Started:** ${time(activity.timestamps?.start ?? activity.createdAt, "R")}`,
                                activity.details ? "\n**Details:** " + activity.details : "",
                                activity.state ? "\n**State:** " + activity.state : "",
                                activity.assets?.largeText ? "\n**Large text:** " + activity.assets.largeText : "",
                                activity.assets?.smallText ? "\n**Small text:** " + activity.assets.smallText : "",
                            ].join(""),
                        )
                        .setThumbnail(activityImage ?? null),
                );
            }
        }

        await interaction.reply({ embeds });
    },
    data: new SlashCommandBuilder()
        .setName("whois")
        .setDescription("Get info on a user")
        .addUserOption(x => x.setName("member").setDescription("The user to get info on").setRequired(true)),
});
