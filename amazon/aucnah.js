import puppeteer from "puppeteer";
import {notifyDiscord} from "./utils/Discord.js"
const URL = "https://www.auchan.fr";
const search_term = "Pokémon TCG";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1339740504409116682/nuOU4AajJFklj01SmidgHJ7TpgQfYSuF67n6q1zGFF2FiSqF897kirp5CoZMnDtDi-Qc";
let previousProducts = new Map();
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
                await notifyDiscord(product, DISCORD_WEBHOOK_URL, "auchan");
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
