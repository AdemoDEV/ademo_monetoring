import puppeteer from "puppeteer";
import fetch from "node-fetch";

const URL = "https://www.fnac.com";
const search_term = "Pokémon TCG";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340314296340713563/gqGJEs0L_2lrn7oun2z0bQjRmDrYxEIZkzPfVakkht0EZMYSFl0AgHcCuKXuZfNiuxU6"; // Remplace par ton webhook Discord

// 🔥 Stockage des produits déjà envoyés pour éviter les doublons
let previousProducts = new Map();

async function notifyDiscord(product) {
    const embed = {
        embeds: [
            {
                title: product.title,
                url: product.url,
                color: 16753920,
                fields: [
                    {
                        name: "💰 Prix",
                        value: `\`\`\`${product.price || "Non disponible"}\`\`\``,
                        inline: true,
                    },
                    {
                        name: "✅ Vendeur",
                        value: `\`\`\`Fnac\`\`\``,
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
                footer: { text: "🔍 Surveillance automatique Fnac FR" },
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

async function checkFnacStock(browser) {
    const page = await browser.newPage();
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    );

    try {
        console.log("🔄 Accès à Fnac FR...");
        await page.goto(URL, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("#Fnac_SearchInput", { timeout: 30000 });

        await page.type("#Fnac_SearchInput", search_term);
        await page.keyboard.press("Enter");

        console.log("🔍 Recherche des produits...");

        await page.waitForSelector(".Article-item", { timeout: 30000 });

        const products = await parse_results(page);
        console.log(`📦 ${products.length} produits trouvés sur Fnac FR`);

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
        return Array.from(document.querySelectorAll(".Article-item")).map(el => {
            const title = el.querySelector(".Article-title")?.innerText || "Produit inconnu";
            const price = el.querySelector(".userPrice")?.innerText || "Non disponible";
            const image = el.querySelector(".thumbnail")?.getAttribute("src") || "";
            const relativeUrl = el.querySelector("a")?.getAttribute("href");
            const url = relativeUrl ? `https://www.fnac.com${relativeUrl}` : "Non disponible";

            return { title, price, image, url, date: "Non précisée" };
        });
    });
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false, // Voir l’exécution en mode normal
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-blink-features=AutomationControlled", // Empêcher la détection de bot
            "--disable-dev-shm-usage",
            "--disable-web-security",
            "--window-size=1920,1080"
        ],
        executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" // Remplace par le chemin de Chrome
    });
    

    console.log("✅ Lancement de Puppeteer en local...");

    // 🔄 Lancer toutes les 30 secondes
    setInterval(async () => {
        console.log("🔄 Vérification des nouveaux produits et retours en stock...");
        await checkFnacStock(browser);
    }, 30 * 1000);
})();
