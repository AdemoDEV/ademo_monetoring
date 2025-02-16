import puppeteer from "puppeteer";
import fetch from "node-fetch";

const URL = "https://www.auchan.fr";
const search_term = "Pokémon TCG";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1339740504409116682/nuOU4AajJFklj01SmidgHJ7TpgQfYSuF67n6q1zGFF2FiSqF897kirp5CoZMnDtDi-Qc"; // Remplace par ton webhook Discord

const EmbedDiscord = {
    panier: "https://www.auchan.fr/checkout/cart/",
    account: "https://www.auchan.fr/client/accueil",
    payment: "https://www.auchan.fr/checkout/cart",
};

let previousProducts = new Map();

async function notifyDiscord(product) {
    console.log("📡 Envoi du produit sur Discord :", product);

    // 🔹 **URL pour ajouter au panier automatiquement**
    const atcURL = `${product.url}?autoAdd=1`;

    const embed = {
        embeds: [
            {
                title: product.title,
                url: product.url,
                color: 5763719, // Couleur violet foncé
                thumbnail: { url: product.image || "https://via.placeholder.com/150" },
                fields: [
                    { name: "**Site**", value: "Auchan FR", inline: false },
                    { name: "**Prix**", value: `\`${product.price || "Non disponible"} €\``, inline: false },
                    { name: "**Liens**", value: `[Redirections vers la page](${product.url})`, inline: false },
                    { name: "**Utils**", value: `[Panier](${EmbedDiscord.panier}) | [Compte](${EmbedDiscord.account}) | [Paiement](${EmbedDiscord.payment})`, inline: false },
                ],
                footer: { text: "🔍 Surveillance automatique Auchan FR" },
                timestamp: new Date().toISOString(),
            },
        ],
    };

    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
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
            console.log("🔄 Tentative d'envoi en message texte...");
            await fetch(DISCORD_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    content: `**${product.title}**\n💰 Prix : ${product.price}\n📦 Disponibilité : ${product.isAvailable ? "✅ En stock" : "❌ Indisponible"}\n🔗 [Voir le produit](${product.url})\n🛒 [Ajouter au panier](${atcURL})`
                }),
            });
            console.log("✅ Produit envoyé sous forme de message texte.");
        }
    } catch (err) {
        console.error("❌ Erreur lors de l'envoi à Discord :", err);
    }
}

async function checkAuchanStock(browser) {
    const page = await browser.newPage();
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    );

    try {
        console.log("🔄 Accès à Auchan FR...");
        await page.goto(URL, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("#search", { timeout: 30000 });

        await page.type("#search input", search_term);
        await page.keyboard.press("Enter");

        console.log("🔍 Recherche des produits...");
        await page.waitForSelector(".list__container", { timeout: 30000 });

        const products = await parse_results(page);
        console.log(`📦 ${products.length} produits trouvés sur Auchan FR`);

        for (const product of products) {
            const previousProduct = previousProducts.get(product.url);

            if (!previousProduct || (previousProduct.price === "Non disponible" && product.price !== "Non disponible")) {
                console.log(`📢 NOUVEAU ou DE RETOUR EN STOCK : ${product.title}, Prix: ${product.price}`);
                await notifyDiscord(product);
            }

            previousProducts.set(product.url, product);
        }
    } catch (err) {
        console.error("❌ Erreur lors du scraping :", err);
    } finally {
        await page.close();
    }
}

async function parse_results(page) {
    return await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".list__container .product-thumbnail")).map(el => {
            const title = el.querySelector(".product-thumbnail__description")?.innerText.trim() || "Produit inconnu";
            const price = el.querySelector(".product-thumbnail__attributes span")?.innerText || "Non disponible";
            const image = el.querySelector(".product-thumbnail__picture meta[itemprop='image']")?.getAttribute("content") || "";
            const relativeUrl = el.querySelector("a")?.getAttribute("href");
            const url = relativeUrl ? `https://www.auchan.fr${relativeUrl}` : "Non disponible";
            return { title, price, image, url };
        });
    });
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    console.log("✅ Lancement de Puppeteer en local...");
    await checkAuchanStock(browser);

    console.log("🛑 Scraping terminé. Fermeture du navigateur.");
    await browser.close();
})();
