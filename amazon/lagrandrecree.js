import puppeteer from "puppeteer";
import { notifyDiscord } from "./utils/Discord.js";

const PROXY_HOST = "geo.iproyal.com";
const PROXY_PORT = "12321";
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";

const URL = "https://www.lagranderecre.fr/jeux-de-societe/cartes-a-collectionner/coffret-dresseur-d-elite-pokemon-ecarlate-et-violet-extension-6-mascarade-crepusculaire.html";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1341520624303996950/8UdDlWLHJgV5bpxMXTj_CIoKTBX7QviqUBLJTN-Coc3SkQoofxmUg8n1Icogo6afnXtQ";

async function checkProductStock(browser) {
    const page = await browser.newPage();

    await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    try {
        console.log("🔄 Accès à La Grande Récré via Proxy...");
        await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });

        console.log("🔍 Extraction des informations du produit...");

        let product = await parseProduct(page);

        if (!product || product.title === "Produit inconnu") {
            console.warn("⚠️ Impossible d'extraire le produit.");
            return;
        }

        console.log(`📢 Produit trouvé : ${product.title}, Prix: ${product.price}, Disponibilité: ${product.stock}`);

        await notifyDiscord(product, DISCORD_WEBHOOK_URL, "lagranderecre", true, product.stock);
    } catch (err) {
        console.error("❌ Erreur lors du scraping :", err);
    } finally {
        await page.close();
    }
}

async function parseProduct(page) {
    return await page.evaluate(() => {
        const title = document.querySelector("h1")?.innerText.trim() || "Produit inconnu";

        // Récupération du prix
        const priceElement = document.querySelector(".scalapay-price");
        let price = priceElement ? priceElement.innerText.trim() : "Non disponible";

        // Vérification de la disponibilité
        const stockElement = document.querySelector(".stock-availability .unavailable");
        let stock = stockElement ? "Indisponible" : "Disponible";

        // Récupération de l'image
        const imageElement = document.querySelector(".media-visuals-main-img");
        const image = imageElement ? imageElement.getAttribute("src") : "Non disponible";

        return { title, price, image, url: window.location.href, stock};
    });
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            `--proxy-server=${PROXY_HOST}:${PROXY_PORT}`,
            "--no-sandbox",
            "--disable-setuid-sandbox"
        ],
    });

    console.log("✅ Lancement de Puppeteer via Proxy...");

    await checkProductStock(browser);

    console.log("🛑 Scraping terminé. Fermeture du navigateur.");
    await browser.close();
})();
