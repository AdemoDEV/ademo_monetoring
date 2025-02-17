import puppeteer from "puppeteer";
import { notifyDiscord } from "./utils/Discord.js";

const PROXY_HOST = "geo.iproyal.com";
const PROXY_PORT = "12321";
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";

const URL = "https://www.e.leclerc/recherche?q=Pok%C3%A9mon%20TCG";
const BASE_URL = "https://www.e.leclerc"; // Pour gérer les URL relatives
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340849038974779402/M_LT1AwDqezTQb3AmTeX5kZqUp6w2ztb_QTpzjZ09HBOO6f2feS6kqDneaCg6gVG4vbb";

let previousProducts = new Map();

async function checkLeclercStock(browser) {
    const page = await browser.newPage();

    await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    try {
        console.log("🔄 Accès à E.Leclerc via Proxy...");
        await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });

        console.log("🔍 Vérification si la page contient des produits...");
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log("🔍 Attente du chargement des produits...");
        await page.waitForSelector(".content.row.m-0.container-loading.list-container.search-results.list-unstyled.mb-0 li", { timeout: 60000 });

        console.log("🛠️ Debug: Nombre de produits détectés ->",
            await page.evaluate(() => document.querySelectorAll(".content.row.m-0.container-loading.list-container.search-results.list-unstyled.mb-0 li").length)
        );

        console.log("🔍 Extraction des produits...");
        let products = await parse_results(page);

        if (products.length === 0) {
            console.warn("⚠️ Aucun produit trouvé, vérifie le sélecteur ou le chargement JS.");
            return;
        }

        console.log(`📦 ${products.length} produits trouvés sur E.Leclerc`);

        for (const product of products) {
            console.log(product.title);
            if (!product.title || product.title === "Produit inconnu") {
                console.warn("⚠️ Produit sans titre détecté, vérification requise !");
                continue;
            }

            const previousProduct = previousProducts.get(product.url);

            if (!previousProduct || (previousProduct.price === "Non disponible" && product.price !== "Non disponible")) {
                console.log(`📢 NOUVEAU ou DE RETOUR EN STOCK : ${product.title}, Prix: ${product.price}`);
                console.log(product.title, product.price, product.url_image, product.url);
                await notifyDiscord(product, DISCORD_WEBHOOK_URL, "leclerc");
                await new Promise(resolve => setTimeout(resolve, 1000)); // Anti-spam
            }

            previousProducts.set(product.url, product);
        }
    } catch (err) {
        console.error("❌ Erreur lors du scraping :", err);

        const failedContent = await page.content();
        console.log("⚠️ Debug HTML après erreur :", failedContent.slice(0, 2000)); // Affiche les 2000 premiers caractères
    } finally {
        await page.close();
    }
}

async function parse_results(page) {
    return await page.evaluate(() => {
        const BASE_URL = "https://www.e.leclerc"; // Défini dans le contexte du navigateur aussi

        return Array.from(document.querySelectorAll(".content.row.m-0.container-loading.list-container.search-results.list-unstyled.mb-0 li")).map(el => {
            const titleElement = el.querySelector(".img-fluid.ng-star-inserted[title]");
            const title = titleElement ? titleElement.getAttribute("title").trim() : "Produit inconnu";

            const imageElement = el.querySelector(".img-fluid.ng-star-inserted[src]");
            const url_image = imageElement ? imageElement.getAttribute("src") : "Non disponible";

            // Récupération du prix
            const priceElement = el.querySelector(".price-unit.ng-star-inserted");
            const price = priceElement ? `${priceElement.innerText.trim()}€` : "Hors stock";

            // Récupération de l'URL du produit
            const productUrlElement = el.querySelector("a");
            let url = productUrlElement ? productUrlElement.getAttribute("href") : "Non disponible";

            // Si l'URL est relative, on la complète avec le BASE_URL
            if (url && !url.startsWith("http")) {
                url = `${BASE_URL}${url}`;
            }

            return { title, price, url_image, url };
        }).filter(product => product.title !== "Produit inconnu");
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

    await checkLeclercStock(browser);

    console.log("🛑 Scraping terminé. Fermeture du navigateur.");
    await browser.close();
})();
