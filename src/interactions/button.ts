import type { ButtonInteraction } from "discord.js";
import { lookup } from "../util/index.js";

export async function handleButton(interaction: ButtonInteraction<"cached">) {
    if (!interaction.customId.includes("-")) return;
    
    const args = interaction.customId.split("-");

    await lookup({
        async reaction() {
            const roleId = args[1];

            if (interaction.member.roles.cache.has(roleId)) {
                await interaction.member.roles.remove(roleId);
                await interaction.reply({ content: `You've been removed from <@&${roleId}>`, ephemeral: true });
            } else {
                await interaction.member.roles.add(roleId);
                await interaction.reply({ content: `You've been added to <@&${roleId}>`, ephemeral: true });
            }
        },
        sub: () => lookup({
            async yes() {
                await interaction.guild.members.cache.get(args[2])?.roles.add(interaction.client.config.mainServer.roles.subscriber);
                await interaction.message.edit({
                    content: interaction.message.content + "\n**Accepted verification**",
                    components: []
                });
            },
            no() {
                return interaction.message.edit({
                    content: interaction.message.content + "\n**Denied verification**",
                    components: []
                });
            }
        }, args[1])
    }, args[0]);
}