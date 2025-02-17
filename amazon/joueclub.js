import puppeteer from "puppeteer";
import { notifyDiscord } from "./utils/Discord.js";

const PROXY_HOST = "geo.iproyal.com";
const PROXY_PORT = "12321";
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";

const URL = "https://www.joueclub.fr/contenu/resultat-de-recherche-produits.html?searchText=Pokemon%20TCG";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340782468802019550/6E7InrbWiYduRdd8ttezYj368GZX_-skyboof1ipZSp_V0pIRJNb8F9QS_Xn0_CyO9SB";

let previousProducts = new Map();

async function checkJoueClubStock(browser) {
    const page = await browser.newPage();

    await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });

    // Définit un User-Agent réaliste
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    try {
        console.log("🔄 Accès à JoueClub via Proxy...");
        await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
        console.log("🔍 Vérification si la page contient des produits...");
        // Ajout d'une pause pour éviter les problèmes de chargement dynamique
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log("🔍 Attente du chargement des produits...");
        await page.waitForSelector(".row.product-list .product__content", { timeout: 60000 });

        console.log("🛠️ Debug: Nombre de produits détectés ->",
            await page.evaluate(() => document.querySelectorAll(".row.product-list .product__content").length)
        );

        console.log("🔍 Extraction des produits...");
        let products = await parse_results(page);

        if (products.length === 0) {
            console.warn("⚠️ Aucun produit trouvé, vérifie le sélecteur ou le chargement JS.");
            return;
        }

        console.log(`📦 ${products.length} produits trouvés sur JoueClub`);

        for (const product of products) {
            console.log(product.title);
            if (!product.title || product.title === "Produit inconnu") {
                console.warn("⚠️ Produit sans titre détecté, vérification requise !");
                continue;
            }

            const previousProduct = previousProducts.get(product.url);

            if (!previousProduct || (previousProduct.price === "Non disponible" && product.price !== "Non disponible")) {
                console.log(`📢 NOUVEAU ou DE RETOUR EN STOCK : ${product.title}, Prix: ${product.price}`);
                await notifyDiscord(product, DISCORD_WEBHOOK_URL, "joueclub");
                await new Promise(resolve => setTimeout(resolve, 1000)); // Anti-spam
            }

            previousProducts.set(product.url, product);
        }
    } catch (err) {
        console.error("❌ Erreur lors du scraping :", err);

        // Capture du HTML en cas d'erreur pour identifier le problème
        const failedContent = await page.content();
        console.log("⚠️ Debug HTML après erreur :", failedContent.slice(0, 2000)); // Affiche les 2000 premiers caractères
    } finally {
        await page.close();
    }
}

async function parse_results(page) {
    return await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".row.product-list .product__content")).map(el => {
            const title = el.querySelector(".product__title-card.product-label")?.innerText.trim() || "Produit inconnu";
            
            // Récupération correcte du prix
            const priceElement = el.querySelector(".price-value");
            let price = "Non disponible";
            if (priceElement) {
                price = priceElement.innerText.trim();
            }

            const image = el.querySelector("img")?.getAttribute("src") || "";
            const relativeUrl = el.querySelector("a")?.getAttribute("href");
            const url = relativeUrl ? relativeUrl : "Non disponible";

            return { title, price, image, url };
        }).filter(product => product.title !== "Produit inconnu");
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

    await checkJoueClubStock(browser);

    console.log("🛑 Scraping terminé. Fermeture du navigateur.");
    await browser.close();
})();
