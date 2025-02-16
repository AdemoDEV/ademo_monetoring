import fetch from "node-fetch";
import {Monitor} from "../config/config.js"
export async function notifyDiscord(product, webhook, Site) {
    const embed = {
        embeds: [
            {
                title: product.title,
                url: product.url,
                color: 5763719, 
                thumbnail: { url: product.image || "https://via.placeholder.com/150" },
                fields: [
                    { name: "**Site**", value: `\`${Monitor.EmbedLink[Site].nameSite}\``, inline: false },
                    { name: "**Prix**", value: `\`${product.price || "Non disponible"} €\``, inline: false },
                    { name: "**Liens**", value: `[Redirections vers la page](${product.url})`, inline: false },
                    { name: "**Utils**", value: `[Panier](${Monitor.EmbedLink[Site].panier}) | [Compte](${Monitor.EmbedLink[Site].account}) | [Paiement](${Monitor.EmbedLink[Site].payment})`, inline: false },
                ],
                footer: { text: "PokéSauce Surveillance" },
                timestamp: new Date().toISOString(),
            },
        ],
    };

    try {
        console.log("📡 Embed envoyé à Discord :", JSON.stringify(embed, null, 2));
        const response = await fetch(webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(embed),
        });
        const responseData = await response.text();
        console.log("📡 Réponse Discord :", responseData);
        if (response.ok) {
            console.log(`✅ Produit envoyé à Discord : ${product.title}`);
        } else {
            console.error("❌ Échec de l'envoi à Discord :", responseData);
        }
    } catch (err) {
        console.error("❌ Erreur lors de l'envoi à Discord :", err);
    }
}

