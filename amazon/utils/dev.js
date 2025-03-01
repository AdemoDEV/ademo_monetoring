client.on('messageCreate', async (message) => {
    if (message.content === '!test') {
        const reglementEmbed = new EmbedBuilder()
            .setColor('#9B59B6') // Couleur violette personnalisée
            .setTitle("📜 Structure d'ajout d'un item")
            .setDescription(`
                **Comment ajouté un item & Commande**\n
                Commande : /additem \`site\` \`liens_produit\`\n
                Respectez bien chaque site à son item.\n
                ⚠️ **SITE :**\n
                1. /additem \`nomduproduit\` \`amazon\` \`liens\`\n
                2. /additem \`nomduproduit\` \`auchan\` \`liens\`\n
                3. /additem \`nomduproduit\` \`dreamland\` \`liens\`\n
                4. /additem \`nomduproduit\` \`fnac\` \`liens\`\n
                5. /additem \`nomduproduit\` \`guizettefamily\` \`liens\`\n
                6. /additem \`nomduproduit\` \`joueclub\` \`liens\`\n
                7. /additem \`nomduproduit\` \`lagrandrecree\` \`liens\`\n
                8. /additem \`nomduproduit\` \`leclerc\` \`liens\`\n
                9. /additem \`nomduproduit\` \`micromania\` \`liens\`\n
                8. /additem \`nomduproduit\` \`smartoys\` \`liens\`\n
                8. /additem \`nomduproduit\` \`vinticards\` \`liens\`\n
                \n
                📎 **FAITE BIEN ATTENTION A LA STRUCTURE**\n
            `)
            .setFooter({ text: 'Ademo Monetoring'})
            .setTimestamp();

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('listitem')
                    .setLabel('💬 Liste des items')
                    .setStyle(ButtonStyle.Primary)
            );
        await message.channel.send({ embeds: [reglementEmbed], components: [row]});
    }
});