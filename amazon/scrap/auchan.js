import { notifyDiscord } from "../utils/Discord.js";
const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1339740504409116682/nuOU4AajJFklj01SmidgHJ7TpgQfYSuF67n6q1zGFF2FiSqF897kirp5CoZMnDtDi-Qc";

export async function Ademo_CheckAuchan(browser, PRODUCT_URLS) {
    for (const URL of PRODUCT_URLS) {
        const page = await browser.newPage();
        await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36");

        try {
            console.log(`🌐 Navigation vers : ${URL}`);
            await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

            const product = await parse_results(page);
            if (!product || !product.title || product.title === "Produit inconnu") {
                console.warn("⚠️ Aucun produit valide trouvé, vérifie le sélecteur ou le chargement JS.");
                await page.close();
                continue;
            }

            if (product.price !== "Non disponible") {
                console.log(`📢 Produit trouvé : ${product.title}, Prix: ${product.price}`);
                await notifyDiscord(product, DISCORD_WEBHOOK_URL, "auchan", false, "non", true, "✅ Disponible", true);
            } else {
                console.log(`📢 Produit indisponible : ${product.title}, Prix: ${product.price}`);
            }
            const delay = 5000 + Math.random() * 5000;
            console.log(`⏱️ Attente de ${Math.round(delay / 1000)} secondes avant le prochain produit...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        } catch (err) {
            console.error("❌ Erreur lors du scraping :", err);
        } finally {
            await page.close();
        }
    }
}

async function parse_results(page) {
    return await page.evaluate(() => {
        const title = document.querySelector("div.offer-selector__name--large")?.innerText.trim() || "Produit inconnu";
        const priceElement = document.querySelector("div.product-price.product-price--large.bolder.text-dark-color");
        let price = priceElement ? priceElement.innerText.trim() : "Non disponible";
        const imageElement = document.querySelector("img.navGalleryImage");
        const image = imageElement ? imageElement.getAttribute("src") : "Non disponible";
        return { title, price, image, url: window.location.href };
    });
}
