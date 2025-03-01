import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle  } from 'discord.js';
import { Monitor } from '../config/config.js';
const DISCORD_TOKEN = 'Njg2MTk2MTAzNzY2MzQzNjk0.GYLb0W.s0ORpuHiDcYOZM9o5Lczo7Q_Xlkw4-h9x6S5pA';

const channelMapping = {
    'vinticards': '1340764805598023802',
    'fnac': '1341887614239641680',
    'micromania': '1340448650836443136',
    'leclerc': '1340848967700840649',
    'smartoys': '1340824255805259816',
    'lagranderecre': '1341520234393239644',
    'joueclub': '1340782454029422624',
    'guizettefamily': '1340837601548177461',
    'dreamland': '1340506933249052703',
    'auchan': '1339740471278309458',
    'amazon': '1340314276451057724'
};

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('ready', () => {
    console.log(`🤖 Connecté en tant que ${client.user.tag}`);
});


export async function notifyDiscord(product, webhooks, Site, stockon, stock) {
    try {
        const channelID = channelMapping[Site];
        if (!channelID) {
            console.error(`❌ Aucun salon Discord configuré pour le site : ${Site}`);
            return;
        }

        const channel = await client.channels.fetch(channelID);

        if (!channel) {
            console.error(`❌ Le salon Discord avec l'ID ${channelID} est introuvable.`);
            return; 
        }
        const embed = new EmbedBuilder()
            .setTitle(product.title)
            .setURL(product.url)
            .setColor(5763719)
            .setThumbnail(product.image || 'https://via.placeholder.com/150')
            .addFields(
                { name: '**🌍 Site**', value: `\`${Monitor.EmbedLink[Site].nameSite}\``, inline: false },
                { name: '**💰 Prix**', value: `\`${product.price || 'Non disponible'}\``, inline: false },
                ...(stockon ? [{ name: '**🏝️ Disponibilité**', value: `\`✖️${stock}\``, inline: false }] : []),
                {
                    name: '**🔗 Liens**',
                    value: `[Redirections vers la page](${product.url})`,
                    inline: false,
                },
                {
                    name: '**🔗 Utils**',
                    value: `[Panier](${Monitor.EmbedLink[Site].panier}) | [Compte](${Monitor.EmbedLink[Site].account}) | [Paiement](${Monitor.EmbedLink[Site].payment})`,
                    inline: false,
                }
            )
            .setFooter({ text: 'PokéSauce Surveillance' })
            .setTimestamp();
        const roleMention = `<@&${Monitor.RoleMention.MENTION_ROLE_ID}> <@&${Monitor.RoleMention.MENTION_ROLE_2}>`;
         await channel.send({
             content: roleMention,
             embeds: [embed],
             allowedMentions: { parse: ['roles'] },
         });
        console.log(`✅ Produit envoyé à Discord (${Site}) : ${product.title}`);
    } catch (err) {
        console.error('❌ Erreur lors de l\'envoi à Discord :', err);
    }
}

// Connexion du bot à Discord
client.login(DISCORD_TOKEN);
