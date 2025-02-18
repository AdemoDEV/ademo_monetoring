import puppeteer from "puppeteer";
import { notifyDiscord } from "./utils/Discord.js";

const PROXY_HOST = "geo.iproyal.com";
const PROXY_PORT = "12321";
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";

const URL = "https://www.smartoys.be/catalog/advanced_search_result.php?keywords=Pokemon+TCG";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340824292102770708/PAlYwwPKVWw1aN3XxdEYRMMWEeNZxLjlLgTyRH-OSXSWSM2BqRNEzHPYpfNPiFI7VUlo";

let previousProducts = new Map();

async function checkSmartoysStock(browser) {
    const page = await browser.newPage();

    await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });

    // Définit un User-Agent réaliste
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    try {
        console.log("🔄 Accès à Smartoys via Proxy...");
        await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });

        console.log("🔍 Vérification si la page contient des produits...");
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log("🔍 Attente du chargement des produits...");
        await page.waitForSelector("#products .col-sm-4.col-md-4.col-lg-3", { timeout: 60000 });

        console.log("🛠️ Debug: Nombre de produits détectés ->",
            await page.evaluate(() => document.querySelectorAll("#products .col-sm-4.col-md-4.col-lg-3").length)
        );

        console.log("🔍 Extraction des produits...");
        let products = await parse_results(page);

        if (products.length === 0) {
            console.warn("⚠️ Aucun produit trouvé, vérifie le sélecteur ou le chargement JS.");
            return;
        }

        console.log(`📦 ${products.length} produits trouvés sur Smartoys`);

        for (const product of products) {
            console.log(product.title);
            if (!product.title || product.title === "Produit inconnu") {
                console.warn("⚠️ Produit sans titre détecté, vérification requise !");
                continue;
            }

            const previousProduct = previousProducts.get(product.url);

            if (!previousProduct || (previousProduct.price === "Non disponible" && product.price !== "Non disponible")) {
                console.log(`📢 NOUVEAU ou DE RETOUR EN STOCK : ${product.title}, Prix: ${product.price}`);
                console.log(product.title, product.price, product.url_image, product.url)
                await notifyDiscord(product, DISCORD_WEBHOOK_URL, "smartoys");
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
        return Array.from(document.querySelectorAll("#products .col-sm-4.col-md-4.col-lg-3")).map(el => {
            const title = el.querySelector(".group.inner.list-group-item-heading.nameart.text-center a")?.innerText.trim() || "Produit inconnu";
            
            // Récupération des parties du prix
            const priceWhole = el.querySelector(".text-center.article-price")?.childNodes[0]?.nodeValue.trim() || "";
            const priceCents = el.querySelector(".text-center.article-price .product-price-sm")?.innerText.trim() || "";
            let price = "Non disponible";
            
            if (priceWhole && priceCents) {
                price = `${priceWhole}${priceCents}`;
            }

            const url_image = el.querySelector(".ProductPicWrapper a img")?.getAttribute("src");
            const image = url_image ? `https://www.smartoys.be/catalog/${image}` : "Non disponible";
            
            const relativeUrl = el.querySelector(".group.inner.list-group-item-heading.nameart.text-center a")?.getAttribute("href");
            const url = relativeUrl ? relativeUrl : "Non disponible";

            return { title, price, image, url };
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

    await checkSmartoysStock(browser);

    console.log("🛑 Scraping terminé. Fermeture du navigateur.");
    await browser.close();
})();
