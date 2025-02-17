import puppeteer from "puppeteer";
import { notifyDiscord } from "./utils/Discord.js";

const PROXY_HOST = "geo.iproyal.com";
const PROXY_PORT = "12321";
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";

const URL = "https://vinticards.be/?s=Pokemon+TCG&post_type=product";  // URL de recherche Pokémon
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340764821024411789/j4AmWOz-wo6l1nzKPhuQUuqqFDRMztkh1-o1KSdQiIIcwHhB8Vwlfc3N8uedCYhlvTOy";  // Ton Webhook Discord

let previousProducts = new Map();

async function checkVintiCardsStock(browser) {
    const page = await browser.newPage();

    await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });

    // Définit un User-Agent réaliste
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    try {
        console.log("🔄 Accès à VintiCards via Proxy...");
        await page.goto(URL, { waitUntil: "networkidle2" });

        console.log("🔍 Attente du chargement des produits...");
        await page.waitForSelector(".products.columns-4.facetwp-template li", { timeout: 30000 });

        console.log("🔍 Extraction des produits...");
        let products = await parse_results(page);

        if (products.length === 0) {
            console.warn("⚠️ Aucun produit trouvé, vérifie le sélecteur ou le chargement JS.");
            return;
        }

        console.log(`📦 ${products.length} produits trouvés sur VintiCards`);

        for (const product of products) {
            console.log(product.title);
            if (!product.title || product.title === "Produit inconnu") {
                console.warn("⚠️ Produit sans titre détecté, vérification requise !");
                continue;
            }

            const previousProduct = previousProducts.get(product.url);

            if (!previousProduct || (previousProduct.price === "Non disponible" && product.price !== "Non disponible")) {
                console.log(`📢 NOUVEAU ou DE RETOUR EN STOCK : ${product.title}, Prix: ${product.price}`);
                await notifyDiscord(product, DISCORD_WEBHOOK_URL, "vinticards");
                await new Promise(resolve => setTimeout(resolve, 1000)); // Anti-spam
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
        return Array.from(document.querySelectorAll(".products.columns-4.facetwp-template li")).map(el => {
            const title = el.querySelector("h2.woocommerce-loop-product__title")?.innerText.trim() || "Produit inconnu";
            
            // Récupération correcte du prix
            const priceElement = el.querySelector(".woocommerce-Price-amount");
            let price = "Non disponible";
            if (priceElement) {
                const currency = priceElement.querySelector(".woocommerce-Price-currencySymbol")?.innerText.trim() || "€";
                price = priceElement.innerText.replace(currency, "").trim() + " " + currency;
            }

            const image = el.querySelector("img")?.getAttribute("src") || "";
            const relativeUrl = el.querySelector("a")?.getAttribute("href");
            const url = relativeUrl ? relativeUrl : "Non disponible";

            return { title, price, image, url };
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

    await checkVintiCardsStock(browser);

    console.log("🛑 Scraping terminé. Fermeture du navigateur.");
    await browser.close();
})();
