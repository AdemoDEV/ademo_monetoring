import puppeteer from "puppeteer";
import fetch from "node-fetch";

const URL = "https://www.micromania.fr/on/demandware.store/Sites-Micromania-Site/default/Search-Show?q=Pok%c3%a9mon%20TCG";
const search_term = "Pokémon TCG";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340448681387626648/0XphuBY_isoGsgXlVRMhyI3v5Ak0nV81I216SU2OGH8b9Pmv7y9sXXt5G44wa2ytFdOJ"; // Remplace par ton webhook Discord

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
                        value: `\`\`\`Micromania FR\`\`\``,
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
                footer: { text: "🔍 Surveillance automatique Micromania FR" },
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

async function checkMicromaniaStock(browser) {
    const page = await browser.newPage();
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    );

    try {
        console.log("🔄 Accès à Micromania FR...");
        await page.goto(URL, { waitUntil: "networkidle2" });
        
        console.log("🔍 Recherche des produits...");

        await page.waitForSelector(".product-grid .product-tile", { timeout: 30000 });

        const products = await parse_results(page);
        console.log(`📦 ${products.length} produits trouvés sur Micromania FR`);

        const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

        for (const product of products) {
            if (!product.title || product.title === "Produit inconnu") {
                console.warn("⚠️ Produit sans titre détecté, vérification requise !", product);
                continue;
            }

            const previousProduct = previousProducts.get(product.url);

            if (!previousProduct || (previousProduct.price === "Non disponible" && product.price !== "Non disponible")) {
                if (product.date === today || !previousProduct) {
                    console.log(`📢 NOUVEAU ou DE RETOUR EN STOCK : ${product.title}, Prix: ${product.price}`);
                    await notifyDiscord(product);
                }
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
        return Array.from(document.querySelectorAll(".product-grid .product-tile")).map(el => {
            const dataGtm = el.getAttribute('data-gtm');
            let title = "Produit inconnu", price = "Non disponible";

            if (dataGtm) {
                try {
                    const parsedData = JSON.parse(dataGtm);
                    title = parsedData.name || title;
                    price = parsedData.price || price;
                } catch (e) {
                    console.error("Erreur parsing data-gtm", e);
                }
            }

            const image = el.querySelector(".product-image img")?.getAttribute("src") || "";
            const relativeUrl = el.querySelector("a")?.getAttribute("href");
            const url = relativeUrl ? `https://www.micromania.fr${relativeUrl}` : "Non disponible";

            return { title, price, image, url, date: "Non précisée" };
        });
    });
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    console.log("✅ Lancement de Puppeteer en local...");

    setInterval(async () => {
        console.log("🔄 Vérification des nouveaux produits et retours en stock...");
        await checkMicromaniaStock(browser);
    }, 30 * 1000);
})();
