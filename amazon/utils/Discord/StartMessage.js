export async function Startmessage(client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder) {
    const channelId = "1345183715181072524";
    try {
        const channel = await client.channels.fetch(channelId);

        if (channel.isTextBased()) {
            const messages = await channel.messages.fetch({ limit: 100 });
            if (messages.size > 0) {
                await channel.bulkDelete(messages);
                console.log(`🗑️ ${messages.size} messages supprimés dans ${channel.name}`);
            } else {
                console.log(`✅ Aucun message à supprimer dans ${channel.name}`);
            }

            const reglementEmbed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle("📜 Structure d'ajout d'un item")
            .setDescription(`
                **Comment ajouté un item & Commande**\n
                Commande : /additem \`site\` \`nom_produit\` \`liens_produit\`\n
                Respectez bien chaque site à son item.\n
            `)
            .setFooter({ text: 'Ademo Monetoring'})
            .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('listitem')
                    .setLabel('💬 Liste des items')
                    .setStyle(ButtonStyle.Primary),
            );

            await channel.send({ embeds: [reglementEmbed], components: [row] });
            console.log("✅ Message de structure d'item envoyé !");
        } else {
            console.error("❌ Le canal spécifié n'est pas un canal textuel !");
        }
    } catch (error) {
        console.error("❌ Erreur lors de la suppression des messages ou de l'envoi du message structuré :", error);
    }
}