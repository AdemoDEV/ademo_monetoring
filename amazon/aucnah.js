import puppeteer from "puppeteer";
import fetch from "node-fetch";

const URL = "https://www.auchan.fr";
const search_term = "Pokémon TCG";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1339740504409116682/nuOU4AajJFklj01SmidgHJ7TpgQfYSuF67n6q1zGFF2FiSqF897kirp5CoZMnDtDi-Qc"; // Remplace par ton webhook Discord

// 🔥 Stockage des produits déjà envoyés pour éviter les doublons
let previousProducts = new Map();

async function notifyDiscord(product) {
    const embed = {
        embeds: [
            {
                title: product.title,
                url: product.url,
                color: 3066993,
                fields: [
                    {
                        name: "💰 Prix",
                        value: `\`\`\`${product.price || "Non disponible"}\`\`\``,
                        inline: true,
                    },
                    {
                        name: "✅ Vendeur",
                        value: `\`\`\`Auchan FR\`\`\``,
                        inline: true,
                    },
                    {
                        name: "🕒 Date d'ajout",
                        value: `\`\`\`${product.date || "Non précisée"}\`\`\``,
                        inline: true,
                    },
                ],
                image: {
                    url: product.image || "https://via.placeholder.com/150",
                },
                footer: { text: "🔍 Surveillance automatique Auchan FR" },
            },
        ],
    };

    await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(embed),
    });

    console.log(`✅ Produit envoyé à Discord : ${product.title}`);
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

        const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

        for (const product of products) {
            const previousProduct = previousProducts.get(product.url);

            // ✅ Vérification si c'est un NOUVEAU produit ajouté aujourd'hui ou un retour en stock
            if (!previousProduct || (previousProduct.price === "Non disponible" && product.price !== "Non disponible")) {
                if (product.date === today || !previousProduct) {
                    console.log(`📢 NOUVEAU ou DE RETOUR EN STOCK : ${product.title}, Prix: ${product.price}`);
                    await notifyDiscord(product);
                }
            }

            // 🔄 Mise à jour de la liste des produits déjà vérifiés
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

            return { title, price, image, url, date: "Non précisée" };
        });
    });
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false, // Mettre `true` si tu veux exécuter en arrière-plan
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    console.log("✅ Lancement de Puppeteer en local...");

    // 🔄 Lancer toutes les 30 secondes
    setInterval(async () => {
        console.log("🔄 Vérification des nouveaux produits et retours en stock...");
        await checkAuchanStock(browser);
    }, 30 * 1000);
})();
