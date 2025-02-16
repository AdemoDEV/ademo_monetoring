import puppeteer from "puppeteer";
import {notifyDiscord} from "./utils/Discord.js"
const URL = "https://www.amazon.fr";
const search_term = "Pokémon TCG";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340314296340713563/gqGJEs0L_2lrn7oun2z0bQjRmDrYxEIZkzPfVakkht0EZMYSFl0AgHcCuKXuZfNiuxU6"; // Remplace par ton webhook Discord

let previousProducts = new Map();
async function checkAmazonStock(browser) {
    const page = await browser.newPage();
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    );
    try {
        console.log("🔄 Accès à Amazon FR...");
        await page.goto(URL, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("#twotabsearchtextbox", { timeout: 30000 });

        await page.type("#twotabsearchtextbox", search_term);
        await page.keyboard.press("Enter");

        console.log("🔍 Recherche des produits...");
        await page.waitForSelector(".s-card-container", { timeout: 30000 });

        const products = await parse_results(page);
        console.log(`📦 ${products.length} produits trouvés sur Amazon FR`);

        for (const product of products) {
            const previousProduct = previousProducts.get(product.url);

            if (!previousProduct || (previousProduct.price === "Non disponible" && product.price !== "Non disponible")) {
                console.log(`📢 NOUVEAU ou DE RETOUR EN STOCK : ${product.title}, Prix: ${product.price}`);
                await notifyDiscord(product, DISCORD_WEBHOOK_URL, "amazon");
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
        return Array.from(document.querySelectorAll(".s-card-container")).map(el => {
            const title = el.querySelector("h2 span")?.innerText || "Produit inconnu";
            const price = el.querySelector(".a-price > .a-offscreen")?.innerText || "Non disponible";
            const image = el.querySelector(".s-image")?.getAttribute("src") || "";
            const relativeUrl = el.querySelector("a")?.getAttribute("href");
            const url = relativeUrl ? `https://www.amazon.fr${relativeUrl}` : "Non disponible";

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
    await checkAmazonStock(browser);

    console.log("🛑 Scraping terminé. Fermeture du navigateur.");
    await browser.close();
})();
