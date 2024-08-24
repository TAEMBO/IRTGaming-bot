import { ApplicationCommandOptionType } from "discord.js";
import { Command } from "#structures";

export default new Command<"chatInput">({
    async run(interaction) {
        const user = interaction.options.getUser("member", true);

        await interaction.deferReply({ ephemeral: true }).then(() => interaction.deleteReply());
        await interaction.channel!.send(`${user} has received an honorary ban!`);
    },
    data: {
        name: "band",
        description: "Introduce an honorary ban",
        options: [
            {
                type: ApplicationCommandOptionType.User,
                name: "member",
                description: "It's an honor",
                required: true
            }
        ]
    }
});
