import puppeteer from "puppeteer";
import { notifyDiscord } from "./utils/Discord.js";

const PROXY_HOST = "geo.iproyal.com";
const PROXY_PORT = "12321";
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";

const URL = "https://www.micromania.fr/on/demandware.store/Sites-Micromania-Site/default/Search-Show?q=Pok%C3%A9mon+TCG";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340448681387626648/0XphuBY_isoGsgXlVRMhyI3v5Ak0nV81I216SU2OGH8b9Pmv7y9sXXt5G44wa2ytFdOJ";

let previousProducts = new Map();

async function checkMicromaniaStock(browser) {
    const page = await browser.newPage();

    await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36");

    try {
        console.log("🔄 Accès à Micromania via Proxy...");
        await page.goto(URL, { waitUntil: "networkidle2" });

        console.log("🔍 Attente du chargement des produits...");
        await page.waitForSelector(".products-grid .product-tile-wrapper", { timeout: 30000 });

        console.log("🔍 Extraction des produits...");
        let products = await parse_results(page);

        if (products.length === 0) {
            console.warn("⚠️ Aucun produit trouvé, vérifie le sélecteur ou le chargement JS.");
            return;
        }

        console.log(`📦 ${products.length} produits trouvés sur Micromania`);

        for (const product of products) {
            console.log(product.title)
            if (!product.title || product.title === "Produit inconnu") {
                console.warn("⚠️ Produit sans titre détecté, vérification requise !");
                continue;
            }

            const previousProduct = previousProducts.get(product.url);

            if (!previousProduct || (previousProduct.price === "Non disponible" && product.price !== "Non disponible")) {
                console.log(`📢 NOUVEAU ou DE RETOUR EN STOCK : ${product.title}, Prix: ${product.price}`);
                await notifyDiscord(product, DISCORD_WEBHOOK_URL, "micromania");
                await new Promise(resolve => setTimeout(resolve, 1000));
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
        return Array.from(document.querySelectorAll(".products-grid .product-tile-wrapper")).map(el => {
            const dataGtm = el.querySelector(".product-tile-left a")?.getAttribute("data-gtm");

            let title = "Produit inconnu";
            let price = "Non disponible";

            if (dataGtm) {
                try {
                    const parsedData = JSON.parse(dataGtm);
                    const product = parsedData?.ecommerce?.click?.products?.[0];
                    title = product?.name || "Produit inconnu";
                    price = product?.price !== undefined ? `${product.price} €` : "Non disponible";
                } catch (err) {
                    console.error("❌ Erreur lors du parsing du JSON data-gtm :", err);
                }
            }
            const image = el.querySelector("img")?.getAttribute("src") || "";
            const relativeUrl = el.querySelector("a[href]")?.getAttribute("href");
            const url = relativeUrl ? `${relativeUrl}` : "Non disponible";

            return {title, price, image, url };
        }).filter(product => product.title !== "Produit inconnu"); // Supprime les produits sans titre
    }); 
}




// 🌟 Lancement du script et arrêt après exécution
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

    await checkMicromaniaStock(browser);

    console.log("🛑 Scraping terminé. Fermeture du navigateur.");
    await browser.close();
})();
