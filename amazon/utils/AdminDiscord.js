import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder  } from 'discord.js';
import { GetProductAll } from '../db/db_function/db_getProductAll.js';
import { AddProductToDB } from '../db/db_function/db_addProduct.js';
import { Startmessage } from './Discord/StartMessage.js';

const DISCORD_TOKEN = 'Njg2MTk2MTAzNzY2MzQzNjk0.GYLb0W.s0ORpuHiDcYOZM9o5Lczo7Q_Xlkw4-h9x6S5pA';
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('ready', async () => {
    console.log(`🤖 Connecté en tant que ${client.user.tag}`);
    Startmessage(client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder);
    const commands = [
        new SlashCommandBuilder()
            .setName('additem')
            .setDescription('Ajouter un produit à la base de données')
            .addStringOption(option =>
                option.setName('site')
                    .setDescription('Site du produit (Ex : AMAZON, AUCHAN, FNAC, KING JOUET)')
                    .setRequired(true)
                    .addChoices(
                        { name: 'AMAZON', value: 'amazon' },
                        { name: 'AUCHAN', value: 'auchan' },
                        { name: 'DREAMLAND', value: 'dreamland' },
                        { name: 'FNAC', value: 'fnac' },
                        { name: 'GUIZETTEFAMILY', value: 'guizettefamily' },
                        { name: 'JOUECLUB', value: 'joueclub' },
                        { name: 'LAGRANDRECRE', value: 'lagrandrecree' },
                        { name: 'LECLERC', value: 'leclerc' },
                        { name: 'MICROMANIA', value: 'micromania' },
                        { name: 'SMARTOYS', value: 'smartoys' },
                        { name: 'VINTICARDS', value: 'vinticards' }
                    )
            )
            .addStringOption(option =>
                option.setName('nom')
                    .setDescription('Nom du produit')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('lien')
                    .setDescription('Lien du produit')
                    .setRequired(true)
            ),
    ];

    await client.application.commands.set(commands);
    console.log('✅ Commande /additem enregistrée avec succès !');
});


client.on('messageCreate', async (message) => {
    if (message.content === '!test') {
        const reglementEmbed = new EmbedBuilder()
            .setColor('#9B59B6') // Couleur violette personnalisée
            .setTitle("📜 Structure d'ajout d'un item")
            .setDescription(`
                **Comment ajouté un item & Commande**\n
                Commande : /additem \`site\` \`nom_produit\` \`liens_produit\`\n
                Respectez bien chaque site à son item.\n
            `)
            .setFooter({ text: 'Ademo Monetoring'})
            .setTimestamp();

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('listitem')
                    .setLabel('💬 Liste des items')
                    .setStyle(ButtonStyle.Primary),
            );
            
        await message.channel.send({ embeds: [reglementEmbed], components: [row]});
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'listitem') {
        try {
            await interaction.deferReply({ ephemeral: false });
            const productsBySite = await GetProductAll();

            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('🛍️ Liste des produits disponibles')
                .setDescription('Voici les produits disponibles sur chaque site :')
                .setFooter({ text: 'A.D.E.M.O - DEV', iconURL: 'https://example.com/logo.png' })
                .setTimestamp();

                for (const [site, products] of Object.entries(productsBySite)) {
                    let siteProducts = products.map(prod => `- [${prod.name}](${prod.url})`).join('\n');
                    if (siteProducts.length > 1024) {
                        siteProducts = siteProducts.substring(0, 1000) + '\n...';
                    }
    
                    embed.addFields({
                        name: `🌐 ${site}`,
                        value: siteProducts || 'Aucun produit disponible',
                        inline: false
                    });
                }
    

            const sentMessage = await interaction.editReply({
                embeds: [embed],
            });

            setTimeout(() => {
                sentMessage.delete().catch(err => console.error('Erreur lors de la suppression du message :', err));
            }, 30000);

        } catch (error) {
            console.error('❌ Erreur lors de la récupération des produits :', error);
            await interaction.followUp({
                content: '❌ Une erreur est survenue lors de la récupération des produits.',
                ephemeral: true
            });
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    if (interaction.commandName === 'additem') {
        const site = interaction.options.getString('site');
        const name = interaction.options.getString('nom');
        const url = interaction.options.getString('lien');

        const urlPattern = /^(https?:\/\/[^\s/$.?#].[^\s]*)$/i;
        if (!urlPattern.test(url)) {
            await interaction.reply({
                content: '❌ Lien du produit invalide ! Veuillez entrer une URL valide.',
                ephemeral: true
            });
            return;
        }

        try {
            await AddProductToDB(site, name, url);
            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('✅ Produit ajouté avec succès !')
                .setDescription(`**Nom :** ${name}
**Site :** ${site}
[Voir le produit](${url})`)
                .setFooter({ text: 'A.D.E.M.O - DEV' })
                .setTimestamp();

            const sentMessage = await interaction.reply({
                embeds: [embed],
                ephemeral: false,
                fetchReply: true
            });

            setTimeout(() => {
                sentMessage.delete().catch(err => console.error('Erreur lors de la suppression du message :', err));
            }, 10000);

        } catch (error) {
            console.error("❌ Erreur lors de l'ajout du produit à la base de données :", error);
            await interaction.reply({
                content: "❌ Une erreur est survenue lors de l'ajout du produit à la base de données.",
                ephemeral: true
            });
        }
    }
});

client.login(DISCORD_TOKEN);

export default client;