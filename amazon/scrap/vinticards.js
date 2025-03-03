import { notifyDiscord } from "../utils/Discord.js";

const PROXY_USERNAME = "77gqbtIxzQs7AwJX";
const PROXY_PASSWORD = "HBTHlQ0d80YKXLex";

// const PRODUCT_URLS = ["https://vinticards.fr/produit/pokemon-coffret-collection-tournoi-premium-helio-fr/"];
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340764821024411789/j4AmWOz-wo6l1nzKPhuQUuqqFDRMztkh1-o1KSdQiIIcwHhB8Vwlfc3N8uedCYhlvTOy";  // Ton Webhook Discord

export async function Ademo_CheckVintiCards(browser, PRODUCT_URLS) {
    for (const URL of PRODUCT_URLS) {
    const page = await browser.newPage();
    await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
    try {
        console.log(`🌐 Navigation vers : ${URL}`);
        await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
        console.log("🔍 Extraction des informations du produit...");

        let product = await parse_results(page);

        if (!product || product.title === "Produit inconnu") {
            console.warn("⚠️ Impossible d'extraire le produit.");
            return;
        }
        if (product.available) {
            console.log(`📢 Produit trouvé : ${product.title}, Prix: ${product.price}`);
            await notifyDiscord(product, DISCORD_WEBHOOK_URL, "vinticards", false, "non", true, "✅ Disponible", true);
        } else {
            console.log(`📢 Produit indisponible : ${product.title}, Prix: ${product.price}`);
        }
    } catch (err) {
        console.error("❌ Erreur lors du scraping :", err);
    } finally {
        await page.close();
    }
 }
}

async function parse_results(page) {
    return await page.evaluate(() => {
        let available = false
        const title = document.querySelector("h1.product_title.entry-title")?.innerText.trim() || "Produit inconnu";
        const priceElement = document.querySelector("span.woocommerce-Price-amount.amount");
        let price = priceElement ? priceElement.innerText.trim() : "Non disponible";
        const imageElement = document.querySelector("img.wp-post-image");
        const availableO = document.querySelector("p.stock.out-of-stock")?.innerText.trim()
        if (availableO == undefined) {
            available = true
        } else {
            available = false
        }
        const image = imageElement ? imageElement.getAttribute("src") : "Non disponible";
        return { title, price, image, url: window.location.href, available};
    });
}